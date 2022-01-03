import librosa


"""Exercise librosa so that our Docker image has the cached libraries."""
def _main():
  filename = librosa.example('nutcracker')
  y, sr = librosa.load(filename)
  tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
  print(tempo, beat_frames)


if __name__ == "__main__":
  _main()