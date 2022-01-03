import sys

import boto3
import librosa
import numpy as np

MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS = 1.0

s3 = boto3.resource("s3")


def lambda_handler(event, _):
  print("got event", event)

  bucket_name = event["bucket"]
  object_key = event["key"]
  practice_id = event["uuid"]

  bucket = s3.Bucket(bucket_name)
  download_filename = f"/tmp/{practice_id}.ogg"
  bucket.download_file(object_key, download_filename)


def process_file(filename):
  if not filename.endswith('ogg'):
    print(
      "Please convert your audio file to .ogg (ogg vorbis) first "
      "(possibly by using ffmpeg)."
    )

  waveform, samplingrate = librosa.load(filename)

  tempo, beat_frames = librosa.beat.beat_track(y=waveform, sr=samplingrate)

  print(f"Tempo is about {tempo} beats per minute.")

  beat_times = librosa.frames_to_time(beat_frames, sr=samplingrate)
  #print(beat_times)

  print(len(waveform))

  # Split the audio waveform into segments of non-silence.
  segments = librosa.effects.split(waveform, top_db=40)

  print("segs", segments)

  # Combine segments that are too close together.
  curated_segments = []
  if segments:
    curated_segment_start = segments[0][0]

    for segment_start, segment_end in segments:
      time_between_segments = librosa.samples_to_time(
        possible_segment_end - segment_start,
        sr=samplingrate
      )

      if time_between_segments >= MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS:
        curated_segments.append([
          curated_segment_start,
          possible_segment_end
        ])
        curated_segment_start = segment_start

      possible_segment_end = segment_end

  # todo - fix last segment.

  print("curated segments", curated_segments)

  sss = []
  for s in segments:
    sss = sss + list(s)

  print("sss", sss)

  segt = librosa.samples_to_time(sss)
  print(segt)

  # todo - Only take intervals that are long enough.

  return {
    "message": "okay done"
  }
