import os
import subprocess
import sys
import tempfile
import time
from io import BytesIO
from pathlib import Path

from flask import Flask, render_template, request, send_file, abort
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {".mp3"}


def is_allowed_file(filename: str) -> bool:
	path = Path(filename)
	return path.suffix.lower() in ALLOWED_EXTENSIONS


def _format_command_for_log(cmd: list[str]) -> str:
	"""Return a human-readable command line for logging (Windows/Unix aware)."""
	try:
		if os.name == "nt":
			# Uses Windows quoting rules
			return subprocess.list2cmdline(cmd)
	except Exception:
		pass
	try:
		import shlex as _shlex  # lazy import to avoid overhead if not needed
		return " ".join(_shlex.quote(a) for a in cmd)
	except Exception:
		return " ".join(cmd)


def _truncate_for_log(text: str, limit: int = 2000) -> str:
	if len(text) <= limit:
		return text
	return text[:limit] + f"... (truncated {len(text) - limit} chars)"


def _wait_for_file_to_stabilize(path: Path, timeout_seconds: float, stable_seconds: float = 0.5) -> bool:
	"""Wait until file appears and its size stops changing for stable_seconds, or timeout.

	Returns True if file exists and stabilizes, False on timeout.
	"""
	deadline = time.time() + max(0.0, timeout_seconds)
	last_size = -1
	last_change_ts = time.time()
	while time.time() < deadline:
		if path.exists():
			try:
				current_size = path.stat().st_size
			except OSError:
				current_size = -1
			if current_size != last_size:
				last_size = current_size
				last_change_ts = time.time()
			else:
				if (time.time() - last_change_ts) >= max(0.0, stable_seconds) and current_size > 0:
					return True
		time.sleep(0.2)
	return path.exists()


def _debug_dump_directory(path: Path) -> None:
	"""Print directory contents with sizes to assist debugging."""
	try:
		entries = list(path.iterdir())
	except Exception as exc:
		print(f"[DIR] Не удалось перечислить каталог {path}: {exc}", flush=True)
		return
	if not entries:
		print(f"[DIR] Каталог пуст: {path}", flush=True)
		return
	print(f"[DIR] Содержимое {path}:", flush=True)
	for entry in entries:
		try:
			size = entry.stat().st_size if entry.is_file() else -1
		except OSError:
			size = -1
		print(f"  - {entry.name}  (file={entry.is_file()}, size={size})", flush=True)


def _find_output_candidate(tmp_path: Path, expected: Path) -> Path | None:
	"""Try to locate a plausible output if expected file is missing.

	Heuristics (in order):
	- file named 'out' without extension
	- any single .mp3 file in directory
	- newest regular file in directory
	"""
	# 1) 'out' without extension
	alt = tmp_path / "out"
	if alt.exists() and alt.is_file():
		return alt
	# 2) any single .mp3
	mp3s = [p for p in tmp_path.iterdir() if p.is_file() and p.suffix.lower() == ".mp3"]
	if len(mp3s) == 1:
		return mp3s[0]
	# 3) newest file
	files = [p for p in tmp_path.iterdir() if p.is_file()]
	if files:
		try:
			files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
			return files[0]
		except Exception:
			return files[0]
	return None


app = Flask(__name__)
app.config.update(
	PROPAGATE_EXCEPTIONS=False,
	TRAP_HTTP_EXCEPTIONS=False,
)


@app.route("/", methods=["GET"])  # type: ignore[misc]
def index():
	return render_template("index.html")


@app.route("/process", methods=["POST"])  # type: ignore[misc]
def process():
	if "files" not in request.files:
		return abort(400, "Не переданы файлы 'files'")

	files = request.files.getlist("files")
	if not files:
		return abort(400, "Список файлов пуст")

	print(f"[REQUEST] /process — получено файлов: {len(files)}", flush=True)
	print(f"[SERVER CWD] {os.getcwd()}", flush=True)

	for f in files:
		if not f.filename:
			return abort(400, "Один из файлов без имени")
		if not is_allowed_file(f.filename):
			return abort(400, f"Недопустимый тип файла: {f.filename}")

	# Управление сохранением временной папки для отладки
	keep_tmp = os.environ.get("KEEP_TMP", "").strip().lower() in {"1", "true", "yes", "y"}
	print(f"[DEBUG] KEEP_TMP={keep_tmp}", flush=True)

	def _process_in_directory(tmp_path: Path):
		saved_paths: list[Path] = []
		for up in files:
			filename = secure_filename(up.filename or "")
			if not filename:
				return abort(400, "Некорректное имя файла")
			file_path = tmp_path / filename
			up.save(file_path)
			saved_paths.append(file_path)
			try:
				file_size = os.path.getsize(file_path)
			except OSError:
				file_size = -1
			print(f"[SAVE] Сохранён файл: {file_path} ({file_size} bytes)", flush=True)

		# Рабочая директория для запуска внешнего инструмента:
		# по умолчанию — директория приложения, можно переопределить RUN_CWD=tmp
		run_cwd_mode = os.environ.get("RUN_CWD", "app").strip().lower()
		run_cwd = Path(__file__).parent if run_cwd_mode in {"app", "app_dir", "appdir", "here"} else tmp_path

		output_path = tmp_path / "out.mp3"

		# Гибкий запуск обработчика
		exe_env = os.environ.get("MIX_EXECUTABLE")
		args_mode = os.environ.get("MIX_ARGS_MODE", "python_script").strip().lower()
		cmd: list[str]
		if exe_env:
			exe_str = exe_env.strip().strip('"').strip("'")
			exe_path = Path(exe_str)
			if not exe_path.is_absolute():
				exe_path = Path(__file__).parent / exe_path
			if not exe_path.exists():
				return abort(500, f"Не найден исполняемый файл обработчика: {exe_path}")
			if args_mode == "inputs_only":
				cmd = [str(exe_path), *[str(p) for p in saved_paths]]
			elif args_mode == "output_then_inputs":
				cmd = [str(exe_path), str(output_path), *[str(p) for p in saved_paths]]
			elif args_mode == "switches_output_inputs":
				cmd = [str(exe_path), "--output", str(output_path), "--inputs", *[str(p) for p in saved_paths]]
			else:
				cmd = [str(exe_path), str(output_path), *[str(p) for p in saved_paths]]
		else:
			cmd = [
				sys.executable,
				str(Path(__file__).with_name("process_script.py")),
				"--output",
				str(output_path),
				"--inputs",
				*[str(p) for p in saved_paths],
			]


		# Если внешний инструмент работает в режиме inputs_only, он пишет в CWD
		if exe_env and args_mode == "inputs_only":
			output_path = run_cwd / "out.mp3"

		print(f"[ENV] MIX_EXECUTABLE={exe_env!r} MIX_ARGS_MODE={args_mode!r}", flush=True)
		print(f"[RUN] CWD_MODE: {run_cwd_mode} → {run_cwd}", flush=True)
		print(f"[RUN] CMD: {_format_command_for_log(cmd)}", flush=True)
		print(f"[RUN] Проверка существования до запуска: {output_path} -> {output_path.exists()}", flush=True)

		try:
			completed = subprocess.run(
				cmd,
				check=False,
				capture_output=True,
				text=True,
				cwd=str(run_cwd),
			)
		except Exception as exc:  # pragma: no cover
			return abort(500, f"Ошибка запуска обработчика: {exc}")

		print(f"[RESULT] returncode={completed.returncode}", flush=True)
		print(f"[RESULT] Проверка существования после завершения: {output_path} -> {output_path.exists()}", flush=True)
		stdout_log = (completed.stdout or "").strip()
		stderr_log = (completed.stderr or "").strip()
		if stdout_log:
			print("[STDOUT]" + ("\n" if "\n" not in stdout_log[:1] else "" ) + _truncate_for_log(stdout_log), flush=True)
		if stderr_log:
			print("[STDERR]" + ("\n" if "\n" not in stderr_log[:1] else "" ) + _truncate_for_log(stderr_log), flush=True)

		if completed.returncode != 0:
			stderr_tail = (completed.stderr or "").strip()[-1000:]
			return abort(500, f"Скрипт завершился с ошибкой ({completed.returncode}): {stderr_tail}")


		# Не все внешние утилиты завершают работу синхронно: некоторые могут
		# порождать фоновые процессы и выходить до записи файла. Разрешим
		# опционально подождать появления и стабилизации файла.
		wait_timeout = float(os.environ.get("WAIT_OUTPUT_SECS", "0") or 0)
		wait_stable = float(os.environ.get("WAIT_STABLE_SECS", "0.5") or 0.5)
		if wait_timeout > 0 and not output_path.exists():
			print(f"[WAIT] Ожидаю out.mp3 до {wait_timeout}s (стабилизация {wait_stable}s)", flush=True)
			_ready = _wait_for_file_to_stabilize(output_path, wait_timeout, wait_stable)
			print(f"[WAIT] Готовность файла: {_ready}", flush=True)
			if not _ready:
				_debug_dump_directory(tmp_path)
				if run_cwd != tmp_path:
					_debug_dump_directory(run_cwd)



		if not output_path.exists():
			print(f"[ERROR] Выходной файл отсутствует: {output_path}", flush=True)
			_debug_dump_directory(tmp_path)
			if run_cwd != tmp_path:
				_debug_dump_directory(run_cwd)
			alt = _find_output_candidate(tmp_path, output_path)
			if alt and alt.exists():
				print(f"[HINT] Найден альтернативный файл: {alt}", flush=True)
				output_path = alt
			else:
				# попробовать поискать и в рабочем каталоге запуска
				if run_cwd != tmp_path:
					alt2 = _find_output_candidate(run_cwd, output_path)
					if alt2 and alt2.exists():
						print(f"[HINT] Найден альтернативный файл в CWD: {alt2}", flush=True)
						output_path = alt2
					else:
						return abort(500, "Скрипт не создал файл out.mp3")

		try:
			out_size = output_path.stat().st_size
		except OSError:
			out_size = -1
		print(f"[OK] Найден выходной файл: {output_path} ({out_size} bytes)", flush=True)

		with open(output_path, "rb") as f:
			data = f.read()
		buffer = BytesIO(data)
		buffer.seek(0)
		return send_file(buffer, as_attachment=True, download_name="out.mp3", mimetype="audio/mpeg")

	if keep_tmp:
		tmp_dir = tempfile.mkdtemp(prefix="mp3_upload_")
		tmp_path = Path(tmp_dir)
		print(f"[TMP] Создана временная папка: {tmp_path}", flush=True)
		try:
			return _process_in_directory(tmp_path)
		finally:
			print(f"[TMP] Папка сохранена для отладки и не удалена: {tmp_path}", flush=True)
	else:
		with tempfile.TemporaryDirectory(prefix="mp3_upload_") as tmp_dir:
			tmp_path = Path(tmp_dir)
			print(f"[TMP] Создана временная папка: {tmp_path}", flush=True)
			return _process_in_directory(tmp_path)

# Унифицированные текстовые ошибки вместо HTML
@app.errorhandler(HTTPException)
def handle_http_exception(error: HTTPException):  # type: ignore[misc]
	message = str(error.description or error.name or "Ошибка")
	return message, error.code or 500, {"Content-Type": "text/plain; charset=utf-8"}


@app.errorhandler(Exception)
def handle_unexpected_exception(error: Exception):  # type: ignore[misc]
	message = f"{error.__class__.__name__}: {error}" if app.debug else "Внутренняя ошибка сервера"
	return message, 500, {"Content-Type": "text/plain; charset=utf-8"}


if __name__ == "__main__":
	# Для локального запуска: python app.py
	host = os.environ.get("HOST", "127.0.0.1")
	port = int(os.environ.get("PORT", "5050"))
	app.run(host=host, port=port, debug=True)

