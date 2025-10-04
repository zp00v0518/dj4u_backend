import librosa
import sys
import numpy as np
import argparse

def get_bpm(y, sr):
    """Calculates BPM for a given audio signal."""
    if len(y) == 0:
        return 0
    # tempo is returned as a numpy array with a single element.
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return int(np.round(tempo[0]))

def get_first_beat_time(y, sr):
    """Calculates the time of the first beat in a given audio signal."""
    if len(y) == 0:
        return 0.0
    _, beats = librosa.beat.beat_track(y=y, sr=sr, units='frames')
    if len(beats) > 0:
        beat_times = librosa.frames_to_time(beats, sr=sr)
        return beat_times[0]
    return 0.0

def get_first_downbeat_time(y, sr):
    """Calculates the time of the first downbeat in a given audio signal using librosa."""
    if len(y) == 0:
        return 0.0

    try:
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        _, beats = librosa.beat.beat_track(y=y, sr=sr, trim=False)

        valid_beats = beats[beats < len(onset_env)]

        if valid_beats.size > 0:
            beat_strength = onset_env[valid_beats]
            downbeat_frames = valid_beats[librosa.util.localmax(beat_strength)]
            
            if downbeat_frames.size > 0:
                downbeat_times = librosa.frames_to_time(downbeat_frames, sr=sr)
                return downbeat_times[0]
                
    except Exception:
        return 0.0

    return 0.0

def main():
    """Main function to parse arguments and run analysis."""
    parser = argparse.ArgumentParser(
        description="Analyze BPM and beat timings of an audio file."
    )
    parser.add_argument("file_path", help="The path to the audio file.")
    parser.add_argument("action", choices=[
        "bpm_full", 
        "bpm_first", 
        "bpm_last", 
        "beat_time_first",
        "beat_time_last",
        "downbeat_time_first",
        "downbeat_time_last",
        "duration_ms"
    ], help="The analysis action to perform.")
    parser.add_argument(
        "-t", "--time",
        type=int,
        default=20,
        help="The time in seconds for segment analysis (default: 20)."
    )

    args = parser.parse_args()

    try:
        y_full, sr = librosa.load(args.file_path, sr=None)
        time_samples = int(args.time * sr)

        result = 0

        if args.action == "bpm_full":
            result = get_bpm(y_full, sr)

        elif args.action == "bpm_first":
            y_first = y_full[:time_samples]
            result = get_bpm(y_first, sr)

        elif args.action == "bpm_last":
            y_last = y_full[max(0, len(y_full) - time_samples):]
            result = get_bpm(y_last, sr)

        elif args.action == "beat_time_first":
            y_first = y_full[:time_samples]
            beat_time = get_first_beat_time(y_first, sr)
            result = int(round(beat_time * 1000))

        elif args.action == "beat_time_last":
            # The beat time is relative to the start of the last segment.
            y_last = y_full[max(0, len(y_full) - time_samples):]
            beat_time = get_first_beat_time(y_last, sr)
            result = int(round(beat_time * 1000))

        elif args.action == "downbeat_time_first":
            y_first = y_full[:time_samples]
            downbeat_time = get_first_downbeat_time(y_first, sr)
            result = int(round(downbeat_time * 1000))

        elif args.action == "downbeat_time_last":
            y_last = y_full[max(0, len(y_full) - time_samples):]
            downbeat_time = get_first_downbeat_time(y_last, sr)
            result = int(round(downbeat_time * 1000))

        elif args.action == "duration_ms":
            duration_seconds = librosa.get_duration(y=y_full, sr=sr)
            result = int(round(duration_seconds * 1000))

        print(result)
        sys.exit(0)

    except Exception as e:
        print(f"Error processing file {args.file_path}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()