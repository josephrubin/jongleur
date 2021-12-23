import * as graphql from "./graphql.server";
import { gql } from "graphql-request";
import { MutationCreateSessionArgs, MutationCreateUserArgs, Session } from "~/generated/graphql-schema";
import { redirect, createCookieSessionStorage } from "remix";

export async function createUser(args: MutationCreateUserArgs) {
  const request = gql`
    mutation CreateUser($username: String!, $password: String!) {
      user: createUser(username: $username, password: $password) {
        username
        principal {
          publicAddress
          secretKey
        }
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

const storage = createCookieSessionStorage({
  cookie: {
    name: "Agora_Session",
    secure: process.env.NODE_ENV === "production",
    secrets: ["ThisIsMySecretTODOLoadFromEnv"],
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

export async function getAccessToken(request: Request) {
  const session = await getUserSession(request);
  console.log("session?", session);
  const accessKey = session.get("accessToken");
  if (!accessKey || typeof accessKey !== "string") return null;
  return accessKey;
}
