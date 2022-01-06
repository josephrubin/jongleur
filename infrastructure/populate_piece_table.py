"""
This is a temporary data population script that is not meant for production.
Don't worry too much about the assumptions hardcoded into this script.
It is just for convenience.
"""
import uuid
import sys

import boto3
import comma


# Our connection to dynamodb.
dynamodb = boto3.resource("dynamodb")


def upload_pieces(pieces_data_file, dynamodb_table_name):
  """Upload pieces from `pieces_data_file` into `dynamodb_table_name`."""
  pieces_data = comma.load(pieces_data_file)
  piece_table = dynamodb.Table(dynamodb_table_name)

  for piece_data in pieces_data:
    piece_table.put_item(
      Item={
        "id": str(uuid.uuid4()),
        "title": f"Scarlatti K{piece_data[0].strip()} in {piece_data[4].strip()}",
        "kIndex": piece_data[0].strip(),
        "lIndex": piece_data[1].strip(),
        "pIndex": piece_data[2].strip(),
        "czIndex": piece_data[3].strip(),
        "key": piece_data[4].strip()
      }
    )


if __name__ == "__main__":
  """
  Upload Pieces in bulk to DynamoDB.
  Use this script to initially populate the pieces table if you
  deploy a new stack and want some data.
  """
  usage_string = f"usage: {sys.argv[0]} <pieces_csv_filename> <dynamodb_table_name>"

  if len(sys.argv) < 3:
    print(usage_string, file=sys.stderr)
    sys.exit(1)

  if "--help" in sys.argv:
    print(usage_string)
    sys.exit(0)

  upload_pieces(sys.argv[1], sys.argv[2])
