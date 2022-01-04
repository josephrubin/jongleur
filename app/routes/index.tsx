import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link } from "remix";
import { Waveform } from "~/components/waveform";
import { User, Piece } from "~/generated/graphql-schema";
import { getAccessToken, readMe, useAccessToken } from "~/modules/users.server";
import practiceStyles from "../styles/routes/practice.css";

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
  let pieces: Piece[] = [
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blag"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blag"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blag"},
    {title: "blag"},
    {title: "blag"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
    {title: "blooh"},
    {title: "blargh"},
    {title: "quuuz"},
  ];
  pieces = pieces.concat(...pieces, ...pieces);

  const recentPieces = pieces.splice(0, 5);

  const accessToken = await getAccessToken(request);
  const user = accessToken ? readMe({accessToken}) : null;

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
          <h1>🕑&nbsp; Recently Played</h1>
          <ol className="practice-pieces">
            {recentPieces.map(piece =>
              <li key={piece.id} className="practice-piece">
                <Link to={`./piece/${piece.id}/1`}>
                  <div>Piece: {piece.title}</div>
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
        {pieces.map(piece =>
          <li key={piece.id} className="practice-piece">
            <Link to={`./piece/${piece.id}/1`}>
              <div>Piece: {piece.title}</div>
            </Link>
          </li>
        )}
      </ol>
    </>
  );
}
