import { NavLink, LinksFunction, LoaderFunction, Outlet, useLoaderData } from "remix";
import { getMostPracticedPiecesSorted, makePieceUrl, makeScarlattiPieceLabel } from "~/modules/pieces";
import { readPiece } from "~/modules/pieces.server";
import { readMyPractices } from "~/modules/practices.server";
import { getAccessToken, redirectToLoginIfNull } from "~/modules/session.server";
import { Piece } from "../generated/graphql-schema";
import practiceStyles from "../styles/routes/practice.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: practiceStyles},
  ];
};

interface LoaderData {
  // The pieces to show in the nav bar.
  readonly navBarPieces: Piece[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const accessToken = redirectToLoginIfNull(await getAccessToken(request));

  const practices = await readMyPractices({ accessToken });

  return {
    navBarPieces: getMostPracticedPiecesSorted(practices),
  };
};

export default function Piece() {
  const { navBarPieces } = useLoaderData<LoaderData>();

  return (
    <div className="piece-container">
      <nav className="pieces-side-nav">
        <ol>
          {navBarPieces.map(piece =>
            <li key={piece.id}>
              <NavLink to={makePieceUrl(piece)}>{makeScarlattiPieceLabel(piece)}</NavLink>
            </li>
          )}
        </ol>
      </nav>
      <Outlet />
    </div>
  );
}
