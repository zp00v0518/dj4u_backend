import argparse
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Demo MP3 processing script")
	parser.add_argument("--output", required=True, help="Path to out.mp3 to write")
	parser.add_argument("--inputs", nargs="+", required=True, help="Input mp3 files")
	return parser.parse_args()


def main() -> None:
	args = parse_args()
	output_path = Path(args.output)
	inputs = [Path(p) for p in args.inputs]
	if not inputs:
		raise SystemExit("No inputs provided")
	first = inputs[0]
	if not first.exists():
		raise SystemExit(f"Input does not exist: {first}")
	# Demo: just copy first input as out.mp3
	shutil.copyfile(first, output_path)


if __name__ == "__main__":
	main()

