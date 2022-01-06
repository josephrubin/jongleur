import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { GraphQLClient, gql } from "graphql-request";

const BUCKET_NAME = process.env.JONG_CLIENT_AUDIO_UPLOAD_BUCKET;
const GRAPHQL_ENDPOINT_URL = process.env.JONG_GRAPHQL_URL;

if (!GRAPHQL_ENDPOINT_URL) {
  throw "No GraphQL URL provided.";
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
};

const s3Client = new S3({
  region: process.env.S3_REGION,
});

// Number of seconds that the presigned URL is active for.
// We don't want these URLs to be stored and used later, so make it as short
// as possible while still leaving enough tie to upload a large audio file.
const PRESIGNED_URL_TTL_SECONDS = 100;

// Our basic GraphQL client that we'll use to verify that the
// provided accessKey is real and get the user's claimed userId.
const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT_URL, {
  headers: {
    // For now we don't need a real auth token to call our API
    // since auth is done in the resolver itself.
    Authorization: "auth-presigned-url-lambda-token",
  },
});

type LambdaHandlerType = (event: { body: string }) => Promise<{ statusCode: number, body: string }>;

// The JSON data that we expect a request to have.
interface RequestBody {
  readonly accessToken: string,
  readonly pieceId: string,
}

const lambdaHandler: LambdaHandlerType = async ({ body }) => {
  const bodyData = JSON.parse(body) as RequestBody;
  if (!bodyData.accessToken || !bodyData.pieceId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Bad request, you did not provide an accessToken/pieceId.",
      }),
      headers: CORS_HEADERS,
    };
  }

  // Check that this piece even exists.
  const existsReponse = await graphqlClient.request(gql`
    query ReadPiece($id: ID!) {
      readPiece(id: $id) {
        id
      }
    }
  `, { id: bodyData.pieceId }
  );
  if (!existsReponse.readPiece) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "That piece does not exist.",
      }),
      headers: CORS_HEADERS,
    };
  }

  // Call into our GraphQL endpoint to validate the user's accessToken
  // and retrieve their userId.
  const response = await graphqlClient.request(gql`
    query ReadMe($accessToken: String!) {
      readAuthenticate(accessToken: $accessToken) {
        userId
      }
    }`, { accessToken: bodyData.accessToken }
  );
  if (!response.readAuthenticate) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "You are not authorized to get a presigned URL.",
      }),
      headers: CORS_HEADERS,
    };
  }

  const userId = response.readAuthenticate.userId;
  const signedUrlKey = `audio/${userId}/${bodyData.pieceId}/${uuidv4()}.ogg`;

  const putAudioObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: signedUrlKey,
    ContentType: "audio/ogg",
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, putAudioObjectCommand, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        signedUrl: signedUrl,
        signedUrlKey: signedUrlKey,
      }),
      headers: CORS_HEADERS,
    };
  }
  catch (err) {
    const errorMessage = "Error creating signed URL.";
    console.log(`${errorMessage}. Error: ${String(err)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: errorMessage,
      }),
      headers: CORS_HEADERS,
    };
  }
};

exports.lambdaHandler = lambdaHandler;
