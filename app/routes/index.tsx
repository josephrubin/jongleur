import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link } from "remix";
import { User, Piece } from "~/generated/graphql-schema";
import { readMe } from "~/modules/users.server";
import { getAccessToken } from "~/modules/session.server";
import practiceStyles from "../styles/routes/practice.css";
import { readPieces } from "~/modules/pieces.server";
import { getMostPracticedPiecesSorted, makePieceUrl, makeScarlattiPieceLabel } from "~/modules/pieces";
import { readMyPractices } from "~/modules/practices.server";

// https://remix.run/api/conventions#meta
export const meta: MetaFunction = () => {
  return {
    title: "Jongleur",
    description: "An application that helps musicians practice their craft.",
  };
};

interface LoaderData {
  readonly user: User | null;
  readonly pieces: Piece[];
  readonly recentPieces: Piece[];
}

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: practiceStyles},
  ];
};

export const loader: LoaderFunction = async ({request}) => {
  const pieces = (await readPieces()).sort((a, b) => Number(a.kIndex) - Number(b.kIndex));

  const accessToken = await getAccessToken(request);
  const user = accessToken ? await readMe({accessToken}) : null;
  const recentPieces = accessToken ? getMostPracticedPiecesSorted(await readMyPractices({ accessToken }), 5) : null;

  return {
    user,
    pieces,
    recentPieces,
  };
};

export default function Index() {
  const { user, pieces, recentPieces } = useLoaderData<LoaderData>();

  return (
    <>
      <div className="welcome-blurb">
        {user ? (
          <>
            <h1>👋 Hey, {user.username}!</h1>
            {"Thanks for signing in. There's no time to waste, play on!"}
          </>
        ) : (
          <>
            <h1>🎹&nbsp; Come Join the Party!</h1>
            {"There's so much music to learn!"} <Link to="./register">Make an account</Link> so you can practice like a pro.
          </>
        )}
      </div>
      {user && (
        <>
          <h2>🕑&nbsp; Recently Played</h2>
          <ol className="practice-pieces">
            {recentPieces.map(piece =>
              <li key={piece.id} className="practice-piece">
                <Link to={makePieceUrl(piece)}>
                  <div>{makeScarlattiPieceLabel(piece)}</div>
                </Link>
              </li>
            )}
          </ol>
        </>
      )}
      <div className="rest-header">
        <hr style={{visibility: "hidden"}} />
        <h1>🎵&nbsp; All From Scarlatti</h1>
        <hr />
      </div>
      <ol className="practice-pieces">
        { /* Each item is a link to a piece if logged in, otherwise a disabled link. */ }
        {pieces.map(piece =>
          <li key={piece.id} className={"practice-piece" + (user === null ? " practice-piece-disabled" : "")}>
            <Link to={user ? makePieceUrl(piece) : "#"}>
              <div>{makeScarlattiPieceLabel(piece)}</div>
            </Link>
          </li>
        )}
      </ol>
    </>
  );
}
