"""
Process an audio file uploaded by a user who has recorded their practice session,
returning waveforms and information about the recording that will be later stored
and displayed to the client.

This lambda handler is called by a StepFunction that gets triggered when an audio
file is uploaded to the client audio ingest bucket. We receive as input the name
of the bucket and the audio's object key.

The output is audio files uploaded to S3 (which will be served from Cloudfront)
as well as a PracticeInput type (see graphql/schema.graphql).

We don't have type generation for Python (we do for Typescript) so we'll have to
be a little careful here to get the right type, but we'll defer actually calling
the  GraphQL mutation to create the Practice to a Typescript lambda later in the
StepFunction chain.
"""
import os
import sys
import tempfile

import boto3
import librosa
from librosa.core.audio import resample
import numpy as np
import soundfile as sf

from matplotlib import pyplot as plt
import librosa.display

# Enables drawing of the waveform along with its segments with matplotlib.
DISPLAY_WAVEFORM = False

# The bucket that we expect the audio files to come from.
FROM_AUDIO_BUCKET_NAME = os.getenv("JONG_CLIENT_AUDIO_UPLOAD_BUCKET_NAME")
# The bucket that we'll upload audio files (such as segments) to for storage.
TO_AUDIO_BUCKET_NAME = os.getenv("JONG_AUDIO_STORAGE_BUCKET_NAME")
# Base URL (without trailing slash) of the cloudfront distribution that will
# be serving our audio files from the TO bucket.
AUDIO_SERVE_DISTRIBUTION_URL = os.getenv("JONG_AUDIO_SERVE_DISTRIBUTION_URL")

# The minimum amount of silence in seconds between two distince segments.
# Thus no two segments should be temporally closer than this.
MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS = 2.4
# The client will be shown a low-fidelity representation of the waveform
# which will have this many amplitude samples per second.
RENDERABLE_WAVEFORM_SAMPLES_PER_SECOND = 5

# Our connection to s3.
s3 = boto3.resource("s3")


def lambda_handler(event, _):
  print("Enter process audio lambda.")
  bucket_name = event["bucket"]
  object_key = event["key"]
  practice_id = event["uuid"]
  print(f"Got event with key {object_key} from bucket {bucket_name} for practice {practice_id}.")

  # There's no way to send the metadata along with the S3 notification since
  # presigned URLs can be used without context.
  # So we need a dirty hack - the presigned URL is only valid for a specific object key,
  # and we generate presigned url keys in the form "audio/{userId}/{pieceId}/{uuid}",
  # thus we can get the metadata from the key itself.
  user_id, piece_id = object_key.split("/")[1:3]
  print(f"This event was triggered by user {user_id} for piece {piece_id}.")

  if bucket_name != FROM_AUDIO_BUCKET_NAME:
    error_message = f"Object from {bucket_name} does not match expected {FROM_AUDIO_BUCKET_NAME}."
    print(error_message)
    raise RuntimeError(error_message)

  # Get the audio file from the source bucket.
  download_filename = f"/tmp/{practice_id}-whole.ogg"
  try:
    bucket = s3.Bucket(FROM_AUDIO_BUCKET_NAME)
    print("Begin downloading file...")
    bucket.download_file(object_key, download_filename)
    print("Downloaded file.")
  except:
    error_message = f"Couldn't download file {object_key} from bucket {bucket_name}"
    print(error_message)
    raise RuntimeError(error_message)

  print("Begin processing file...")
  with tempfile.TemporaryDirectory() as temp_dir:
    result = process_file(download_filename, temp_dir)
    print("Processed file.")

    # Upload the waveform and its segments to S3, and store their Cloudfront URLs.
    print("Uploading audio files...")
    storage_bucket = s3.Bucket(TO_AUDIO_BUCKET_NAME)
    whole_waveform_key = f"audio/{user_id}/{piece_id}/{practice_id}/whole.ogg"
    try:
      storage_bucket.upload_file(download_filename, whole_waveform_key)
      result["audioUrl"] = f"{AUDIO_SERVE_DISTRIBUTION_URL}/{whole_waveform_key}"
    except Exception as e:
      print(e)
      raise e
    for i, segment in enumerate(result["segments"]):
      try:
        segment_waveform_key = f"audio/{user_id}/{piece_id}/{practice_id}/{i}.ogg"
        storage_bucket.upload_file(segment["audioFile"], segment_waveform_key)
        segment.pop("audioFile")
        segment["audioUrl"] = f"{AUDIO_SERVE_DISTRIBUTION_URL}/{segment_waveform_key}"
        result["segments"][i] = segment
      except Exception as e:
        print(e)
        raise e
    print("Uploaded audio files.")

  return {
    "userId": user_id,
    "pieceId": piece_id,
    "practiceId": practice_id,
    **result
  }


def process_file(filename, temp_dir):
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

  # We expect long audio files which are quite large. So we have to load as
  # a stream of chunks because we can't fit it all into memory at once.
  samplingrate = librosa.get_samplerate(filename)
  block_length = 2 ** 19
  stream = librosa.stream(
    filename,
    block_length=block_length,
    frame_length=1,
    hop_length=1,
    mono=True
  )

  # Split the audio waveform into segments of non-silence.
  sample_count = 0
  segments = []
  tempos = []
  waveform = []
  for i, block in enumerate(stream):
    sample_count += len(block)

    # Split this block into nonsilent intervals.
    block_segments = librosa.effects.split(block, top_db=40)
    # Preserve global segment sample indices, not block indices.
    block_segments += (i * block_length)
    segments.extend(block_segments)

    # Calculate the tempo of this block.
    tempo, _ = librosa.beat.beat_track(y=block, sr=samplingrate)
    tempos.append(tempo)

    # If displaying, save the whole waveform, block by block.
    if DISPLAY_WAVEFORM:
      waveform.extend(block)

  curated_segments = merge_nearby_segments(segments, samplingrate, MINIMUM_SILENCE_BETWEEN_SEGMENTS_IN_SECONDS)

  if DISPLAY_WAVEFORM:
    segment_times = librosa.samples_to_time(curated_segments, sr=samplingrate)
    plt.figure()
    librosa.display.waveshow(y=np.array(waveform), sr=samplingrate)
    plt.vlines(segment_times, ymin=-1, ymax=1)
    plt.show()

  # Get a low-fidelity, resampled version of the waveform for the front end.
  renderable_waveform, renderable_waveform_sr = librosa.load(
    filename,
    sr=RENDERABLE_WAVEFORM_SAMPLES_PER_SECOND,
    mono=True,
    res_type="polyphase"
  )

  # Save the audio files that we're going to upload to S3. Just save the segments
  # because the whole waveform was already downloaded earlier.
  output_segments = []
  for i, segment in enumerate(curated_segments):
    segment_filename = f"{temp_dir}/segment-{str(i)}.ogg"
    segment_waveform = waveform[segment[0]:segment[1]]
    sf.write(segment_filename, segment_waveform, samplingrate, format='ogg', subtype='vorbis')

    # Create the output type in TypeScript naming conventions because this object
    # will closely track the type of a SegmentInput.
    sampling_ratio = renderable_waveform_sr / samplingrate
    output_segments.append({
      "renderableSampleFirst": segment[0] * sampling_ratio,
      "renderableSampleLast": segment[1] * sampling_ratio,
      "durationSeconds": librosa.samples_to_time(
        segment[1] - segment[0],
        sr=samplingrate
      ),
      "audioFile": segment_filename,
    })

  # Create the output type in TypeScript naming conventions because this object
  # will closely track the type of a PracticeInput.
  return {
    "durationSeconds": librosa.samples_to_time(
      sample_count,
      sr=samplingrate
    ),
    "tempoBpm": np.mean(tempos),
    "renderableWaveform": renderable_waveform.tolist(),
    "renderableWaveformSamplesPerSecond": renderable_waveform_sr,
    "segments": output_segments
  }


def merge_nearby_segments(segments, samplingrate, minimum_silence_between_segments_in_seconds):
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
      if time_between_segments >= minimum_silence_between_segments_in_seconds:
        # If the time is large, the last segment is a curated segment...
        curated_segments.append([prev_segment_start, prev_segment_end])
        # ...and this segment is the first of a new curated segment.
        prev_segment_start = segment_start

      # Either way, update the end of the curated segment so far.
      prev_segment_end = segment_end
    
    # The segment we just saw is the final segment, so this must be included.
    curated_segments.append([prev_segment_start, prev_segment_end])

  return curated_segments


if __name__ == "__main__":
  """
  Run the program from the command line.
  The first argument is the path to an audio file.
  """
  usage_string = f"usage: {sys.argv[0]} <filename>"

  if len(sys.argv) < 2:
    print(usage_string, file=sys.stderr)
    sys.exit(1)

  if "--help" in sys.argv:
    print(usage_string)
    sys.exit(0)

  with tempfile.TemporaryDirectory() as temp_dir:
    result = process_file(sys.argv[1], temp_dir)

  print(
    f"Processed waveform of length {result['durationSeconds']} seconds of tempo {result['tempoBpm']} "
    f"with {len(result['segments'])} segments."
  )
