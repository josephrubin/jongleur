/**
 * Right now we just have this single resolver which handles
 * all queries and mutations.
 */

import { Mutation, MutationCreateSessionArgs, MutationCreateUserArgs, User, Session, MutationRefreshSessionArgs, QueryReadAuthenticateArgs, AuthenticatedUser, Principal, QueryReadPieceArgs, MutationCreatePracticeArgs, Piece, Practice } from "~/generated/graphql-schema";
import { AsrLambdaHandler, DecodedAccessToken } from "./appsync-resolver-types";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProvider, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
import { v4 as uuidv4 } from "uuid";
import { error } from "aws-cdk/lib/logging";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as crypto from "crypto";
import jwt_decode from "jwt-decode";

// See https://github.com/aws/aws-sdk-js-v3/tree/main/lib/lib-dynamodb.

// Our infra file guarantees certain env variables form the
// otherwise unknown environment.
interface JongEnv {
  readonly JONG_DYNAMODB_REGION: string;
  readonly JONG_COGNITO_REGION: string;
  readonly JONG_PIECE_TABLE: string;
  readonly JONG_PRACTICE_TABLE: string;
  readonly JONG_USER_POOL_ID: string;
  readonly JONG_USER_POOL_CLIENT_ID: string;
}
const jongEnv = process.env as unknown as JongEnv;

// Constants from the environment.
const DYNAMODB_REGION = jongEnv.JONG_DYNAMODB_REGION;
const COGNITO_REGION = jongEnv.JONG_DYNAMODB_REGION;
const PIECE_TABLE = jongEnv.JONG_PIECE_TABLE;
const PRACTICE_TABLE = jongEnv.JONG_PRACTICE_TABLE;

const USER_POOL_ID = jongEnv.JONG_USER_POOL_ID;
const USER_POOL_CLIENT_ID = jongEnv.JONG_USER_POOL_CLIENT_ID;

// Our connection to DynamoDB. Created when this lambda starts.
const dynamoDbDocumentClient = DynamoDBDocument.from(
  new DynamoDB({ region: DYNAMODB_REGION })
);

// Our connection to Cognito.
const cognitoClient = new CognitoIdentityProvider({
  region: COGNITO_REGION,
});

// A verifier that can validate Cognito JWTS.
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  clientId: USER_POOL_CLIENT_ID,
  tokenUse: "access",
});

// A GraphQL schema type that has at least an id.
interface TypeWithId {
  readonly id: string
}

/**
 * Resolve the AppSync data request.
 * @param event the AppSync event.
 * @param context the lambda execution context.
 * @param callback the function to call with errors / results.
 */
const lambdaHandler: AsrLambdaHandler = async (event) => {
  // The name of the parent we are resolving inside and the field we're resolving.
  const { parentTypeName, fieldName } = event.info;
  // Arguments to the GraphQL field.
  const args = event.arguments;
  // The parent object (as it was returned from the resolver) if this is a subquery.
  // Thus we are not guaranteed to have this object. If we do, it contains every
  // attribute that was returned from the resolver. If we optimize in the future, we
  // cannot guarantee what fields will be present. But we will always want to have at
  // least the id here for types with id so we will never optimize that away (so we can
  // find related sub-objects).
  const source = event.source;

  console.log(`Resolve field ${fieldName} on parent ${parentTypeName}.`);

  // Our Cognito client app secret used to auth requests to Cognito.
  // We get it on every request because it might change.
  // TODO - only get it for requests that we might need it.
  const cognitoAppSecret = (await cognitoClient.describeUserPoolClient({
    UserPoolId: USER_POOL_ID,
    ClientId: USER_POOL_CLIENT_ID,
  })).UserPoolClient?.ClientSecret;
  if (!cognitoAppSecret) {
    throw "Error getting Cognito app secret.";
  }
  function calculateSecretHash(message: string): string {
    if (cognitoAppSecret) {
      return calculateSecretHashWithKey(message, cognitoAppSecret);
    }
    else {
      throw "Attempt to calculate secret hash without Cognito app secret.";
    }
  }

  // First we find the name of the parent type that this request is coming from,
  // then we find the name of the field we are trying to resolve.
  if (parentTypeName === "Query") {
    if (fieldName === "readAuthenticate") {
      const readAuthenticateArgs = (args as QueryReadAuthenticateArgs);

      const accessToken = readAuthenticateArgs.accessToken;
      try {
        await accessTokenVerifier.verify(accessToken);
        console.log("Access token verified.");
      }
      catch {
        console.log("Verification error when trying to authenticate a user.");
        return null;
      }

      const decodedAccessToken = jwt_decode(accessToken) as DecodedAccessToken;

      const authenticatedUser: Omit<AuthenticatedUser, "user" | "practices"> = {
        accessToken: accessToken,
        userId: decodedAccessToken.sub,
        username: decodedAccessToken.username,
      };

      return authenticatedUser;
    }
    else if (fieldName === "readPieces") {
      // Return all pieces.
      try {
        const { Items: pieces } = await dynamoDbDocumentClient.scan({
          TableName: PIECE_TABLE,
        });
        return pieces;
      }
      catch (err) {
        throw `Error reading pieces: ${String(err)}`;
      }
    }
    else if (fieldName === "readPiece") {
      // Return a single piece by id.
      const { id } = args as QueryReadPieceArgs;

      try {
        const { Item: piece } = await dynamoDbDocumentClient.get({
          TableName: PIECE_TABLE,
          Key: {
            id: id,
          },
        });
        // Return the piece we found or null to signal that we didn't find one.
        return piece;
      }
      catch (err) {
        throw `Error fetching piece with id ${id}: ${String(err)}`;
      }
    }
  }
  else if (parentTypeName === "Mutation") {
    if (fieldName === "createPractice") {
      const createCollectionArgs = (args as MutationCreatePracticeArgs);

      // Ensure that the caller is verified.
      const accessToken = createCollectionArgs.accessToken;
      try {
        await accessTokenVerifier.verify(accessToken);
      }
      catch {
        console.log("Verification error.");
        return null;
      }

      const decodedAccessToken = jwt_decode(accessToken) as DecodedAccessToken;

      // Create a new collection object without custom nested types that we need to
      // store elsewhere.
      // TODO: ingest recording and make the practice
      const practiceBase: Omit<Practice, never> = objectWithoutKeys({
        id: uuidv4(),
      }, []);

      // First store the nested casts in DynamoDB...
      /*
      const savedCasts: Cast[] = [];
      const storeCastPromises = [];
      for (let i = 0; i < createCollectionArgs.input.casts.length; i++) {
        const castInput = createCollectionArgs.input.casts[i];

        // Create a new cast object for each cast in the input, assign it the input
        // data, and give it some default values.
        const cast: Cast = {
          id: uuidv4(),
          isClaimed: false,
          assignedPrincipal: null,
          ...castInput,
        };
        savedCasts.push(cast);

        // Save the cast, making sure to add values for our global secondary indices.
        const putPromise = dynamoDbDocumentClient.put({
          TableName: CAST_TABLE,
          Item: {
            collectionId: collectionBase.id,
            userId: decodedAccessToken.sub,
            ...cast,
          },
        });
        storeCastPromises.push(putPromise);
      }
      try {
        await Promise.all(storeCastPromises);
      }
      catch (err) {
        error("Error storing at least one cast.");
      }*/

      // ...then store the Practice.
      try {
        await dynamoDbDocumentClient.put({
          TableName: PRACTICE_TABLE,
          Item: practiceBase,
        });
      }
      catch (err) {
        error(`Error storing practice with id ${practiceBase.id}.`);
      }

      // We also have to return the new Practice that we created with the mutation.
      // We've been saving this information in RAM so we can do it easily. Note that
      // we may be tempted to just recurse on a Query, but DynamoDB is only eventually
      // consistent so that might not even work anyway.
      const practice: Practice = {
        ...practiceBase,
      };
      return practice;
    }
    else if (fieldName === "createUser") {
      const { username, password } = (args as MutationCreateUserArgs);
      try {
        // Try to sign up the user in cognito.
        const signUpResponse = await cognitoClient.signUp({
          ClientId: USER_POOL_CLIENT_ID,
          SecretHash: calculateSecretHash(username),
          Username: username,
          Password: password,
        });

        // Now that the user has been signed up, generate and store the user's
        // any additional information associated with it.
        /*
        const principal = await stx.createPrincipal(password);
        try {
          await dynamoDbDocumentClient.put({
            TableName: PRINCIPAL_TABLE,
            Item: {
              publicAddress: principal.publicAddress,
              password: principal.password,
              secretKey: principal.secretKey,
              stxPrivateKey: principal.stxPrivateKey,
              userId: signUpResponse.UserSub,
            },
          });
        }
        catch (err) {
          error(`Error storing Principal for user ${signUpResponse.UserSub}.`);
        }*/

        // For now, we will confirm every user. In the future we may
        // wish to have users confirm their email address.
        await cognitoClient.adminConfirmSignUp({
          UserPoolId: USER_POOL_ID,
          Username: username,
        });

        const user: User = {
          username: username,
        };
        return user;
      }
      catch (err) {
        throw `Error creating user: ${String(err)}.`;
      }
    }
    else if (fieldName === "createSession") {
      const { username, password } = (args as MutationCreateSessionArgs);

      try {
        const initiateAuthResult = await cognitoClient.adminInitiateAuth({
          ClientId: USER_POOL_CLIENT_ID,
          UserPoolId: USER_POOL_ID,
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: username,
            SECRET_HASH: calculateSecretHash(username),
            PASSWORD: password,
          },
        });

        const accessToken = initiateAuthResult.AuthenticationResult?.AccessToken;
        const refreshToken = initiateAuthResult.AuthenticationResult?.RefreshToken;
        if (accessToken && refreshToken) {
          // Authentication success! Return the tokens as the session.
          const session: Session = {
            accessToken: accessToken,
            refreshToken: refreshToken,
          };
          return session;
        }
        else {
          // Authentication worked but no tokens were created.
          throw "Authentication did not fail but tokens were not created.";
        }
      }
      catch {
        // Authentication failed.
        const session: Session = {
          accessToken: null,
          refreshToken: null,
        };
        return session;
      }
    }
    else if (fieldName === "refreshSession") {
      const { username, refreshToken:inputRefreshToken } = (args as MutationRefreshSessionArgs);

      try {
        const initiateAuthResult = await cognitoClient.adminInitiateAuth({
          ClientId: USER_POOL_CLIENT_ID,
          UserPoolId: USER_POOL_ID,
          AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
          AuthParameters: {
            REFRESH_TOKEN: inputRefreshToken,
            SECRET_HASH: calculateSecretHash(username),
          },
        });

        const accessToken = initiateAuthResult.AuthenticationResult?.AccessToken;
        const refreshToken = initiateAuthResult.AuthenticationResult?.RefreshToken;
        if (accessToken && refreshToken) {
          // Authentication success! Return the tokens as the session.
          const session: Session = {
            accessToken: accessToken,
            refreshToken: refreshToken,
          };
          return session;
        }
        else {
          // Authentication worked but no tokens were created.
          throw "Authentication did not fail but tokens were not created.";
        }
      }
      catch {
        // Authentication failed.
        const session: Session = {
          accessToken: null,
          refreshToken: null,
        };
        return session;
      }
    }
  }
  else if (parentTypeName === "AuthenticatedUser") {
    if (fieldName === "practices") {
      try {
        const { Items: practices } = await dynamoDbDocumentClient.query({
          TableName: PRACTICE_TABLE,
          IndexName: "userId_index",
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: {
            ":uid": (source as AuthenticatedUser).userId,
          },
        });
        return practices;
      }
      catch {
        throw "Error fetching practices.";
      }
    }
  }
  /*
  else if (parentTypeName === "Collection") {
    if (fieldName === "casts") {
      // Return all casts in the parent collection. There's no need to define
      // a resolver for the cast data field because it will be stored in the cast table
      // and subject to the default resolver.
      const { Items: casts } = await dynamoDbDocumentClient.query({
        TableName: CAST_TABLE,
        IndexName: "collectionId_index",
        KeyConditionExpression: "collectionId = :cid",
        ExpressionAttributeValues: {
          ":cid": (source as TypeWithId).id,
        },
      });

      returnResultIfExists(casts, "Error fetching casts.");
    }
  }
  */
  else {
    throw `Invalid parentTypeName ${parentTypeName}.`;
  }

  // If we reach here, we have not yet called result or error
  // (synchronously) so we must report an error.
  throw `No resolver found for field ${fieldName} from parent type ${parentTypeName}.`;

  // TODO: keep scanning until we get all the elements for reads.
  // TODO: use requested vars to limit scan for more efficiency
  //  rather than wait for gql to filter it out using
  //  event.info.selectionSetList.
};

/**
 * API calls to our Cognito User Pool must be authenticated with the secret key that our client
 * app has. (This is optional, but we've added to it enhance security.) This function will
 * sign (HMAC) a message with that key.
 */
function calculateSecretHashWithKey(message: string, key: string) {
  return crypto.createHmac("sha256", key).update(message).update(USER_POOL_CLIENT_ID).digest("base64");
}

/**
 * Returns the source object with the specified keys removed.
 * Respects the types to produce a correctly typed output. We use
 * a cast or two (this can be avoided with more clever type
 * metaprogramming) but this should be valid and is much simpler.
 */
function objectWithoutKeys<T extends object, K extends keyof T>(source: T, keysToRemove: K[]): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(source).filter(([key, _value]) => !keysToRemove.includes(key as K))
  ) as Omit<T, K>;
}

exports.lambdaHandler = lambdaHandler;
