import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link } from "remix";
import { Waveform } from "~/components/audio";
import practiceStyles from "../styles/routes/practice.css";

// https://remix.run/api/conventions#meta
export const meta: MetaFunction = () => {
  return {
    title: "Jongleur",
    description: "An application that helps musicians practice their craft.",
  };
};

interface LoaderData {
  readonly pieces: Piece;
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
  ];

  return {
    pieces,
  };
};

export default function Index() {
  const { pieces } = useLoaderData<LoaderData>();

  return (
    <>
      <h1>Practice</h1>
      <ol className="practice-pieces">
        {pieces.map(piece =>
          <li key={piece.id} className="practice-piece">
            <Link to={`./${piece.id}`}>
              <div>Piece: {piece.title}</div>
            </Link>
          </li>
        )}
      </ol>
      <Waveform
        height={100}
        samples={[1, 2, 4, 8, 16, 3, 55, 2, 3, 2, 45, 3, 4, 20, 33, 4, 5, 6, 21]}
        segments={[
          {startIndex: 0, endIndex: 1},
        ]}
      />
      <br />
      <Waveform
        height={100}
        samples={[3, 5, 3, 7, 8, 5, 3, 2, 3, 4, 1, 2, 1, 2, 7, 8, 7, 5, 7, 4, 4, 6, 7, 6, 1, 4, 3, 4, 4, 5]}
        segments={[
          {startIndex: 0, endIndex: 9},
          {startIndex: 14, endIndex: 23},
          {startIndex: 25, endIndex: 29},
        ]}
      />
    </>
  );
}
