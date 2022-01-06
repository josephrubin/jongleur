import { redirect, createCookieSessionStorage, useMatches } from "remix";
import { MutationCreateSessionArgs, MutationRefreshSessionArgs, Session as JongSession } from "../generated/graphql-schema";
import { gql } from "graphql-request";
import * as graphql from "./graphql.server";
import { readMe } from "./users.server";


/**
 * Redirect to the login page if the argument (usually an accessToken) is null.
 * Use like:
 * const accessToken = redirectToLoginIfNull(await getAccessToken(request));
 */
export function redirectToLoginIfNull<T>(value: T | null): T {
  if (value === null) {
    throw redirect("/login");
  }
  return value;
}

/**
 * If the access token has expired, refresh the access token and store the user's
 * new session. This should ojnly be called if the user actually has a (possibly
 * expired session). If they don't, we'll attempt to get them to log in.
 */
export async function refreshAccessTokenIfNeeded(request: Request): Promise<void> {
  const [username, accessToken, refreshToken] = await Promise.all([
    getUsername(request),
    getAccessToken(request),
    getRefreshToken(request),
  ]);

  const loginUrl = "/login";
  if (username === null || accessToken === null || refreshToken === null) {
    // The user isn't even logged in. Destroy the remnants
    // of whatever session they have and redirect to login.
    throw await deleteSessionRedirectResponse(request, loginUrl);
  }

  // Try to use the session's accessToken to see if it is still valid.
  const me = await readMe({
    accessToken: accessToken,
  });
  if (me === null) {
    // The session must be expired, refresh it, and send back a response to
    // store the new session and navigate to the original URL.
    const refreshedSession = await refreshJongSession({
      username: username,
      refreshToken: refreshToken,
    });
    if (refreshedSession === null) {
      // If the session is still null after refreshing, something is wrong with
      // the old session - it needs to be destroyed and created again.
      throw await deleteSessionRedirectResponse(request, loginUrl);
    }
    throw await createSessionRedirectResponse(refreshedSession, request.url);
  }
}


export async function createJongSession(args: MutationCreateSessionArgs) {
  const request = gql`
    mutation CreateSession($username: String!, $password: String!) {
        session: createSession(username: $username, password: $password) {
          username
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

export async function refreshJongSession(args: MutationRefreshSessionArgs): Promise<JongSession> {
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

/* User sessions are implemented with a cookie that we store client-side that is passed
with every request to the server. */
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
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

export async function deleteSessionRedirectResponse(
  request: Request,
  redirectTo: string
) {
  const session = await getSession(
    request.headers.get("Cookie")
  );
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function createSessionRedirectResponse(
  sessionData: JongSession,
  redirectTo: string
) {
  const session = await getSession();
  session.set("username", sessionData.username);
  session.set("accessToken", sessionData.accessToken);
  session.set("refreshToken", sessionData.refreshToken);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export function getUserSession(request: Request) {
  return getSession(request.headers.get("Cookie"));
}

/**
 * From a user request, get the username that they've sent
 * in their cookie on the server side.
 */
export async function getUsername(request: Request) {
  const session = await getUserSession(request);
  const username = session.get("username");
  if (!username || typeof username !== "string") {
    return null;
  }
  return username;
}

/**
 * From a user request, get the access token that they've sent
 * in their cookie on the server side.
 */
export async function getAccessToken(request: Request) {
  const session = await getUserSession(request);
  const accessToken = session.get("accessToken");
  if (!accessToken || typeof accessToken !== "string") {
    return null;
  }
  return accessToken;
}

/**
 * From a user request, get the refresh token that they've sent
 * in their cookie on the server side.
 */
export async function getRefreshToken(request: Request) {
  const session = await getUserSession(request);
  const refreshToken = session.get("refreshToken");
  if (!refreshToken || typeof refreshToken !== "string") {
    return null;
  }
  return refreshToken;
}
