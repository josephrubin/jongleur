/**
 * AWS doesn't really supply types for its poorly documented lambdas.
 * Here are some types for AppSync lambda resolvers.
 * These are not complete. Add to these types as more fields are
 * needed / discovered.
 */

/**
 * Type for lambda handlers that resolve AppSync requests.
 */
export type AsrLambdaHandler = (event: AsrEvent, context: AsrContext, callback: AsrCallback) => void

/**
 * Type for the event object passed to AppSync lambda resolvers.
 */
export interface AsrEvent {
  readonly arguments: object,
  readonly request: object,
  readonly source?: object,
  readonly info: {
    readonly selectionSetList: string[],
    readonly selectionSetGraphQL: string,
    readonly fieldName: string,
    readonly parentTypeName: "Query" | "Mutation",
    readonly variables: object
  }
}

/**
 * Type for the context object passed to AppSync lambda resolvers.
 */
export interface AsrContext {
  readonly callbackWaitsForEmptyeventLoop: boolean,
  readonly functionVersion: string,
  readonly functionName: string,
  readonly memoryLimitInMB: string,
  readonly logGroupName: string,
  readonly logStreamName: string,
  readonly invokedFunctionArn: string,
  readonly awsRequestId: string
}

/**
 * Type for the callback function passed to AppSync lambda resolvers.
 */
export type AsrCallback = (errorMessage: string | null, result: object | null) => never;

/**
 * Type for a decoded AccessToken JWT
 */
export interface DecodedAccessToken {
  readonly sub: string,
  event_id: string,
  token_use: string,
  scope: string,
  auth_time: number,
  iss: string,
  exp: number,
  iat: number,
  jti: string,
  client_id: string,
  username: string
}
