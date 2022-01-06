import * as graphql from "./graphql.server";
import { gql } from "graphql-request";
import { AuthenticatedUser, MutationCreateSessionArgs, MutationCreateUserArgs, MutationRefreshSessionArgs, QueryReadAuthenticateArgs, Session } from "~/generated/graphql-schema";

export async function createUser(args: MutationCreateUserArgs) {
  console.log("Enter createUser.");

  const request = gql`
    mutation CreateUser($username: String!, $password: String!) {
      user: createUser(username: $username, password: $password) {
        username
      }
    }
  `;

  const response = await graphql.request(request, {
    username: args.username,
    password: args.password,
  });

  return response.user;
}

export async function readMe(args: QueryReadAuthenticateArgs): Promise<AuthenticatedUser> {
  const request = gql`
    query ReadMe($accessToken: String!) {
      readAuthenticate(accessToken: $accessToken) {
        user {
          username
        }
        username
      }
    }
  `;

  const response = await graphql.request(request, {
    accessToken: args.accessToken,
  });

  return response.readAuthenticate;
}
