import sys
import os
from pydub import AudioSegment

def convert_wav_to_mp3(input_path):
    """
    Converts a WAV file to an MP3 file.

    The output file will be saved in the same directory with the same name,
    but with the .mp3 extension.

    Args:
        input_path (str): The path to the input WAV file.
    """
    if not os.path.exists(input_path):
        print(f"Error: File not found at {input_path}", file=sys.stderr)
        return

#    if not input_path.lower().endswith('.wav'):
#        print(f"Error: Input file must be a .wav file.", file=sys.stderr)
#        return

    # Generate the output path by replacing .wav with .mp3
    output_path = os.path.splitext(input_path)[0] + ".mp3"

    try:
        # Load the WAV file
        print(f"Loading {input_path}...")
        audio = AudioSegment.from_wav(input_path)

        # Export as MP3
        print(f"Converting to MP3... saving as {output_path}")
        audio.export(output_path, format="mp3")

        print("Conversion successful!")

    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        print("Please ensure you have ffmpeg installed and accessible in your system's PATH.", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert.py <path_to_wav_file>", file=sys.stderr)
        sys.exit(1)

    wav_file_path = sys.argv[1]
    convert_wav_to_mp3(wav_file_path) 