import sys

import librosa
import librosa.display
import numpy as np
import matplotlib
import matplotlib.pyplot as plt

matplotlib.use('TkAgg')

def _main():
  filename = sys.argv[1]
  if not filename.endswith('ogg'):
    print(
      "Please convert your audio file to .ogg (ogg vorbis) first "
      "(possibly by using ffmpeg)."
    )
  print(filename)

  #demofilename = librosa.example('nutcracker')

  # Load the file, using a lower sampling rate so it will go faster.
  waveform, samplingrate = librosa.load(filename)
  #print(waveform, samplingrate)

  tempo, beat_frames = librosa.beat.beat_track(y=waveform, sr=samplingrate)
  print('Estimated tempo: {:.2f} beats per minute'.format(tempo))
  #print(f"{beat_frames=}")

  beat_times = librosa.frames_to_time(beat_frames, sr=samplingrate)
  #print(beat_times)

  print(len(waveform))

  segments = librosa.effects.split(waveform, top_db=40)

  print("segs", segments)

  sss = []
  for s in segments:
    sss = sss + list(s)

  print("sss", sss)

  segt = librosa.samples_to_time(sss)
  print(segt)

  # todo - Only take intervals that are long enough.

  plt.figure()
  librosa.display.waveshow(y=waveform, sr=samplingrate)
  plt.vlines(segt, ymin=-1, ymax=1)
  plt.show()

if __name__ == '__main__':
  _main()