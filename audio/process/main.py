import sys

import librosa
import numpy as np

def lambda_handler(event, _):
  # TODO: fix
  filename = event["filename"]

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
