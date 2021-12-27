import { Link, LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { Piece } from "../generated/graphql-schema";
import practiceStyles from "../styles/routes/practice.css";

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

export default function Practice() {
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
    </>
  );
}
