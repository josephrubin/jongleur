/** Client module for interacting with our graphql backend.
 * We use graphql-request https://github.com/prisma-labs/graphql-request
 * at the moment. It is a fairly light library that is React-unaware
 * and our module provides a wrapper aroung it.
*/

import { GraphQLClient } from "graphql-request";

/* The location of our GraphQL server. */
const GRAPHQL_ENDPOINT = process.env.JONG_GRAPHQL_URL || "";
/* The API key allows us to access the API. In production, we
can authenticate by IAM instead, but in development, this key
is crucial. */
const GRAPHQL_API_KEY = "da2-biyunghbvzac7fvtxfyzpptp5u";

const graphQlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    // Right now we use API key auth with a single known key but
    // TODO this will probably end up changing.
    "x-api-key": GRAPHQL_API_KEY,
  },
});

/* We'll let other modules handle the specific graph requests.
 * Here we will reveal the general method for making requests
 * which does allow settings to be set on a single-request basis.
 *
 * Direct assignment saves us from having to type the exported functions,
 * but this means we gotta do a context binding hack so the functions
 * aren't executed with this module's `this` context. */
const request = graphQlClient.request.bind(graphQlClient);
const rawRequest = graphQlClient.rawRequest.bind(graphQlClient);
const batchRequests = graphQlClient.batchRequests.bind(graphQlClient);

export { request, rawRequest, batchRequests };
