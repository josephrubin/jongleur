/**
 * Client module for interacting with our graphql backend.
 * We use graphql-request https://github.com/prisma-labs/graphql-request
 * at the moment. It is a fairly light library that is React-unaware
 * and our module provides a wrapper aroung it.
*/

import { GraphQLClient } from "graphql-request";

/* The location of our GraphQL server. We'll hit the real server for
now when developing locally too, but we may wish to mock it later.
In production, the real endpoint is available through the env var.
In development, we'll have to hardcode the URL if it ever changes. */
const GRAPHQL_ENDPOINT =
  process.env.JONG_GRAPHQL_URL
  || "https://xvjyccqrpbdcjj3wsop4mg7ode.appsync-api.us-east-1.amazonaws.com/graphql";
console.log(`Creating GraphQL module and attaching to endpoint: ${GRAPHQL_ENDPOINT}`);

const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    // For now we don't need a real auth token to call our API
    // since auth is done in the resolver itself.
    Authorization: process.env.NODE_ENV === "production"
      ? "prod-auth-token"
      : "dev-auth-token",
  },
});

/* We'll let other modules handle the specific graph requests.
 * Here we will reveal the general method for making requests
 * which does allow settings to be set on a single-request basis.
 *
 * Direct assignment saves us from having to type the exported functions,
 * but this means we gotta do a context binding hack so the functions
 * aren't executed with this module's `this` context. */
const request = graphqlClient.request.bind(graphqlClient);
const rawRequest = graphqlClient.rawRequest.bind(graphqlClient);
const batchRequests = graphqlClient.batchRequests.bind(graphqlClient);

export { request, rawRequest, batchRequests };
