import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link } from "remix";
import { Waveform } from "~/components/waveform";
import practiceStyles from "../styles/routes/practice.css";

// https://remix.run/api/conventions#meta
export const meta: MetaFunction = () => {
  return {
    title: "Jongleur",
    description: "An application that helps musicians practice their craft.",
  };
};

interface LoaderData {
  readonly pieces: Piece[];
  readonly recentPieces: Piece[];
}

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: practiceStyles},
  ];
};

export const loader: LoaderFunction = async () => {
  const pieces: Piece[] = [
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

  const recentPieces = pieces.splice(0, 5);

  return {
    pieces,
    recentPieces,
  };
};

export default function Index() {
  const { pieces, recentPieces } = useLoaderData<LoaderData>();
  const signedIn = false;
  const userName = "Joseph";

  return (
    <>
      <div className="welcome-blurb">
        {signedIn ? (
          <>
            <h1>👋 Hey, {userName}!</h1>
            Thanks for signing in. There's no time to waste, play on!
          </>
        ) : (
          <>
            <h1>🎹&nbsp; Come Join the Party!</h1>
            There's so much music to learn! <Link to="./register">Make an account</Link> so you can practice like a pro.
          </>
        )}
      </div>
      {signedIn && (
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
      <h1>🎵&nbsp; All From Scarlatti</h1>
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
