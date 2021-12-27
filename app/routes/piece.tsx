import { Link, LinksFunction, LoaderFunction, Outlet, useLoaderData } from "remix";
import { Piece } from "../generated/graphql-schema";
import practiceStyles from "../styles/routes/practice.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: practiceStyles},
  ];
};

interface LoaderData {
  readonly pieces: Piece[];
}

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
    <div className="piece-container">
      <nav className="pieces-side-nav">
        <ol>
          {pieces.map(piece =>
            <li key={piece.id}>
              <Link to="./">Piece name</Link>
            </li>
          )}
        </ol>
      </nav>
      <Outlet />
    </div>
  );
}
