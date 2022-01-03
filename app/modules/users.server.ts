import * as graphql from "./graphql.server";
import { gql } from "graphql-request";
import { MutationCreateSessionArgs, MutationCreateUserArgs, MutationRefreshSessionArgs, QueryReadAuthenticateArgs, Session } from "~/generated/graphql-schema";
import { redirect, createCookieSessionStorage, useMatches } from "remix";

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

export async function createSession(args: MutationCreateSessionArgs) {
  const request = gql`
    mutation CreateSession($username: String!, $password: String!) {
      session: createSession(username: $username, password: $password) {
        accessToken
        refreshToken
      }
    }
  `;

  const response = await graphql.request(request, {
    username: args.username,
    password: args.password,
  });

  return response.session;
}

export async function refreshSession(args: MutationRefreshSessionArgs) {
  const request = gql`
    mutation RefreshSession($username: String!, $refreshToken: String!) {
      session: refreshSession(username: $username, refreshToken: $refreshToken) {
        accessToken
        refreshToken
      }
    }
  `;

  const response = await graphql.request(request, {
    username: args.username,
    refreshToken: args.refreshToken,
  });

  return response.session;
}

export async function readMe(args: QueryReadAuthenticateArgs) {
  const request = gql`
    query ReadMe($accessToken: String!) {
      readAuthenticate(accessToken: $accessToken) {
        user {
          username
        }
      }
    }
  `;

  const response = await graphql.request(request, {
    accessToken: args.accessToken,
  });

  return response.readAuthenticate.user;
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "Jongleur_Session",
    secure: process.env.NODE_ENV === "production",
    secrets: ["ThisIsMySecretTODOLoadFromEnvBetter"], // TODO: load secret from env.
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function deleteUserSessionRedirect(
  request: Request,
  redirectTo: string
) {
  const session = await storage.getSession(
    request.headers.get("Cookie")
  );
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function createSessionRedirect(
  sessionData: Session,
  redirectTo: string
) {
  const session = await storage.getSession();
  session.set("accessToken", sessionData.accessToken);
  session.set("refreshToken", sessionData.refreshToken);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

/**
 * From a user request, get the access token that they've sent
 * in their cookie on the server side.
 */
export async function getAccessToken(request: Request) {
  const session = await getUserSession(request);
  const accessKey = session.get("accessToken");
  if (!accessKey || typeof accessKey !== "string") {
    return null;
  }
  return accessKey;
}

/**
 * Assuming you have called `getAccessToken` in the root route,
 * this custom hook will retrieve the token on the client side!
 */
export function useAccessToken(): string | null {
  // Get all loader data from parent routes.
  const matches = useMatches();
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    // Look for the access token at the root route.
    if (match.pathname === "/" && Object.keys(match.data).includes("accessToken")) {
      return match.data.accessToken;
    }
  }
  return null;
}
