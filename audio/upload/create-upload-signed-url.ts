import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.JONG_BUCKET;

const s3Client = new S3({
  region: process.env.MARCUS_REGION,
});

// Number of seconds that the presigned URL is active for.
const PRESIGNED_URL_TTL_SECONDS = 60;

// The interface for events passed to this lambda.
interface EventType {
  // The Cognito accessKey of the user wishing to get a URL.
  readonly accessKey: string;
}

const lambdaHandler = async (event: EventType) => {
  const { accessKey } = event;

  // TODO: verify the access key and get the sub as userId if verified.

  const userId = "TODO";
  const signedUrlKey = `audio/${userId}/${uuidv4()}`;

  const putAudioObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: signedUrlKey,
    ContentType: "audio/ogg",
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, putAudioObjectCommand, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });

    return JSON.stringify({
      statusCode: 200,
      body: {
        signedUrl: signedUrl,
        signedUrlKey: signedUrlKey,
      },
    });
  }
  catch (err) {
    const errorMessage = "Error creating signed URL.";
    console.log(`${errorMessage}. Error: ${String(err)}`);
    return JSON.stringify({
      statusCode: 500,
      body: {
        message: errorMessage,
      },
    });
  }
};

exports.lambdaHandler = lambdaHandler;
