import os
import sys

import boto3
import librosa
from librosa.core.audio import resample
import numpy as np

FROM_AUDIO_BUCKET_NAME = os.getenv("JONG_CLIENT_AUDIO_UPLOAD_BUCKET_NAME")
TO_AUDIO_BUCKET_NAME = os.getenv("JONG_AUDIO_STORAGE_BUCKET_NAME")

MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS = 1.0
RENDERABLE_WAVEFORM_SAMPLES_PER_SECOND = 5

s3 = boto3.resource("s3")


def lambda_handler(event, _):
  print("Enter process audio lambda.")
  bucket_name = event["bucket"]
  object_key = event["key"]
  practice_id = event["uuid"]
  print(f"Got event with key {object_key} from bucket {bucket_name} for practice {practice_id}.")

  if bucket_name != FROM_AUDIO_BUCKET_NAME:
    error_message = f"Object from {bucket_name} does not match expected {FROM_AUDIO_BUCKET_NAME}."
    print(error_message)
    raise RuntimeError(error_message)

  try:
    bucket = s3.Bucket(FROM_AUDIO_BUCKET_NAME)
    download_filename = f"/tmp/{practice_id}.ogg"
    print("Begin downloading file...")
    bucket.download_file(object_key, download_filename)
    print("Downloaded file.")
  except:
    error_message = f"Couldn't download file {object_key} from bucket {bucket_name}"
    print(error_message)
    raise RuntimeError(error_message)

  print("Begin processing file...")
  result = process_file(download_filename)
  print("Processed file.")

  # Upload the file partitions.
  """
  storage_bucket = s3.Bucket(TO_AUDIO_BUCKET_NAME)
  for key, filename in result.partitions:
    try:
      pass
    except:
      pass
  """

  return result


def process_file(filename):
  """
  Process an audio file, returning data as well as a list of filenames that should
  be uploaded to S3 for permanent practice recording storage.
  """
  if not filename.endswith('ogg'):
    print(
      "Please convert your audio file to .ogg (ogg vorbis) first "
      "(possibly by using ffmpeg).",
      file=sys.stderr
    )
    sys.exit(1)

  # Load the audio file using the standard sampling rate.
  waveform, samplingrate = librosa.load(filename)
  # Get a low-fidelity, resampled version of the waveform for the front end.
  renderable_waveform = librosa.resample(
    waveform,
    orig_sr=samplingrate,
    target_sr=RENDERABLE_WAVEFORM_SAMPLES_PER_SECOND,
    res_type="polyphase"
  )

  # Calculate the approximate tempo of the audio.
  tempo, beat_frames = librosa.beat.beat_track(y=waveform, sr=samplingrate)

  # Split the audio waveform into segments of non-silence.
  segments = librosa.effects.split(waveform, top_db=40)

  # Combine segments that are too close together. Each segment is an interval (a, b).
  # We'll created a curated list of segments such that no (_, b) (a', _) segment pair
  # has b and a' being too close together.
  curated_segments = []
  if len(segments) > 0:
    prev_segment_start = prev_segment_end = None

    for segment_start, segment_end in segments:
      # We don't process a segment until we get to the next one, so
      # skip the first segment and call it the previous segment.
      if prev_segment_start is None or prev_segment_end is None:
        prev_segment_start = segment_start
        prev_segment_end = segment_end
        continue

      # Compute the time between this segment and the last.
      time_between_segments = librosa.samples_to_time(
        segment_start - prev_segment_end,
        sr=samplingrate
      )
      if time_between_segments >= MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS:
        # If the time is large, the last segment is a curated segment...
        curated_segments.append([prev_segment_start, prev_segment_end])
        # ...and this segment is the first of a new curated segment.
        prev_segment_start = segment_start

      # Either way, update the end of the curated segment so far.
      prev_segment_end = segment_end
    
    # The segment we just saw is the final segment, so this must be included.
    curated_segments.append([prev_segment_start, prev_segment_end])

  print("curated segments", curated_segments)

  sss = []
  for s in segments:
    sss = sss + list(s)

  print("sss", sss)

  segt = librosa.samples_to_time(sss)
  print(segt)

  # todo - Only take intervals that are long enough.

  # Return a list of volume samples along with a list of segment intervals
  # along the amplitude list of nonsilence.

  return {
    "message": "okay done"
  }


if __name__ == "__main__":
  usage_string = f"usage: {sys.argv[0]} <filename>"

  if len(sys.argv) < 2:
    print(usage_string, file=sys.stderr)
    sys.exit(1)

  if "--help" in sys.argv:
    print(usage_string)
    sys.exit(0)

  process_file(sys.argv[1])