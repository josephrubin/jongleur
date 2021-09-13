import sys

import librosa
import librosa.display
import numpy as np
import matplotlib.pyplot as plt

def _main():
  filename = sys.argv[1]
  print(filename)

  demofilename = librosa.example('nutcracker')

  waveform, samplingrate = librosa.load(filename)
  #print(waveform, samplingrate)

  tempo, beat_frames = librosa.beat.beat_track(y=waveform, sr=samplingrate)
  print('Estimated tempo: {:.2f} beats per minute'.format(tempo))
  #print(f"{beat_frames=}")

  beat_times = librosa.frames_to_time(beat_frames, sr=samplingrate)
  #print(beat_times)

  plt.figure()
  librosa.display.waveplot(y=waveform, sr=samplingrate)
  plt.show()

if __name__ == '__main__':
  _main()