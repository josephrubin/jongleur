import { Link } from "remix";
import statsStyles from "../styles/routes/stats.css";

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: statsStyles},
  ];
};

export default function Stats() {
  const favoritePieces = [
    {},
    {},
    {},
  ];

  return (
    <>
      <h1>{"Here's What You've Been Up To"}</h1>
      <h2>😊 Favorite Pieces</h2>
      <ol className="practice-pieces">
        {favoritePieces.map(piece =>
          <li key={piece.id} className="practice-piece">
            <Link to="./">
              <div>
                One
              </div>
            </Link>
          </li>
        )}
      </ol>
      <h2>The Numbers</h2>
      <h3>⏱ Total practice time</h3>
      <p>Three hours</p>
      <h3>🎙 Number of practice recordings</h3>
      <p>Seven</p>
      <h3>🎹 Number of pieces practiced</h3>
      <p>Four</p>
    </>
  );
}
