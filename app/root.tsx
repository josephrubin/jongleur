import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  NavLink,
  LoaderFunction
} from "remix";
import type { LinksFunction } from "remix";

import globalStylesUrl from "~/styles/global.css";
import { getAccessToken, refreshAccessTokenIfNeeded } from "./modules/session.server";
import { useAccessToken } from "./modules/session";

// https://remix.run/api/app#links
export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: globalStylesUrl },
  ];
};

// https://remix.run/api/conventions#default-export
// https://remix.run/api/conventions#route-filenames
export default function App() {
  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  );
}

/**
 * This loader will run on every GET page request because it is at the root.
 * The main task is to see if the user is logged in. If they are, make sure
 * that they don't have an obviously expired accessToken. If they do, refresh
 * it.
 *
 * If they are not logged in, that's okay too. All child routes will be able
 * to use the useAccessToken hook to get the acceessTokenn (or null if the
 * user is not logged in).
 */
export const loader: LoaderFunction = async ({request}) => {
  // The root loader gets the user's accessToken so all child
  // routes can access it through useAccessToken!
  const accessToken = await getAccessToken(request);

  // If we actually got an access token (the user is logged in),
  // ensure that it's a valid access token, and refresh it if
  // needed.
  if (accessToken !== null) {
    await refreshAccessTokenIfNeeded(request);
  }

  return { accessToken };
};

// https://remix.run/docs/en/v1/api/conventions#errorboundary
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <Document title="Error!">
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Sorry about that.
          </p>
        </div>
      </Layout>
    </Document>
  );
}

// https://remix.run/docs/en/v1/api/conventions#catchboundary
export function CatchBoundary() {
  const caught = useCatch();

  console.log("IN CATCH BOUNDARY");

  let message;
  switch (caught.status) {
    case 401:
      message = (
        <p>
          Oops! Looks like you tried to visit a page that you do not have access
          to.
        </p>
      );
      break;
    case 404:
      message = (
        <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      );
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
      </Layout>
    </Document>
  );
}

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const accessToken = useAccessToken();

  return (
    <div className="remix-app">
      <header className="remix-app__header">
        <div className="container remix-app__header-content">
          <Link to="/" title="Remix" className="remix-app__header-home-link">
            <JongleurLogo />
          </Link>
          <nav aria-label="Main navigation" className="remix-app__header-nav">
            <ul>
              {!accessToken && (
                <>
                  <li>
                    <NavLink to="/register">Sign Up</NavLink>
                  </li>
                  <li>
                    <NavLink to="/login">Sign In</NavLink>
                  </li>
                </>
              )}
              {accessToken && (
                <li>
                  <NavLink to="/stats">Your Stats</NavLink>
                </li>
              )}
              {accessToken && (
                <li>
                  <form method="post" action="/logout">
                    <button className="logout-button" type="submit">
                      <a className="logout-button-text">Logout</a>
                    </button>
                  </form>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
      <div className="remix-app__main">
        <div className="container remix-app__main-content">{children}</div>
      </div>
      <footer className="remix-app__footer">
        <div className="container remix-app__footer-content">
          <p>&copy; Jongleur</p>
        </div>
      </footer>
    </div>
  );
}

function JongleurLogo() {
  return (
    <div><big><b>🎼 Jongleur</b></big></div>
  );
}
