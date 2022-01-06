import { Link, LinksFunction, LoaderFunction, redirect, useLoaderData } from "remix";
import { Practice, Piece } from "~/generated/graphql-schema";
import { readMyPractices } from "~/modules/practices.server";
import { getAccessToken, redirectToLoginIfNull } from "~/modules/session.server";
import statsStyles from "../styles/routes/stats.css";
// Library (MIT license) to make a text string from a number.
// https://www.npmjs.com/package/number-to-text
import * as numberToText from "number-to-text";
import { getMostPracticedPiecesSorted, makePieceUrl, makeScarlattiPieceLabel } from "~/modules/pieces";
import { makePieceToPracticesMap } from "~/modules/pieces";
require("number-to-text/converters/en-us");

function roundToTextSentenceCase(value: number) {
  const text = numberToText.convertToText(Math.round(value));
  return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
}

export const links: LinksFunction = () => {
  return [
    {rel: "stylesheet", href: statsStyles},
  ];
};

interface LoaderData {
  readonly practices: Practice[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const accessToken = redirectToLoginIfNull(await getAccessToken(request));

  const practices = await readMyPractices({ accessToken: accessToken });

  return { practices };
};

export default function Stats() {
  const { practices } = useLoaderData<LoaderData>();

  // Calculate practice time in mintues or hours, whichever makes more sense.
  const totalPracticeTimeSeconds = practices.reduce((acc, practice) => acc + practice.durationSeconds, 0);
  const totalPracticeTimeMinutes = totalPracticeTimeSeconds / 60;
  const totalPracticeTimeHours = totalPracticeTimeMinutes / 60;
  const totalPracticeTimeString =
    totalPracticeTimeHours < 3
      ? `${roundToTextSentenceCase(totalPracticeTimeMinutes)} minutes`
      : `${roundToTextSentenceCase(totalPracticeTimeHours)} hours`;

  // Calculate number of practice recordings.
  const practiceRecordingsCountString = roundToTextSentenceCase(practices.length);

  // Calculate number of pieces practiced.
  const piecesSortedByPracticeCount = getMostPracticedPiecesSorted(practices);
  const piecesPracticedCountString = roundToTextSentenceCase(piecesSortedByPracticeCount.length);

  // Calculate the most practiced pieces.
  const favoritePieces = piecesSortedByPracticeCount.slice(0, 5);

  return (
    <>
      <h1>{"Here's What You've Been Up To"}</h1>
      <h2>😊 Favorite Pieces</h2>
      <ol className="practice-pieces">
        {favoritePieces.length <= 0
          ? <span>None yet!</span>
          : favoritePieces.map(piece =>
            <li key={piece.id} className="practice-piece">
              <Link to={makePieceUrl(piece)}>
                <div>
                  {makeScarlattiPieceLabel(piece)}
                </div>
              </Link>
            </li>
          )}
      </ol>
      <h2>The Numbers</h2>
      <h3>⏱ Total practice time</h3>
      <p>{totalPracticeTimeString}</p>
      <h3>🎙 Number of practice recordings</h3>
      <p>{practiceRecordingsCountString}</p>
      <h3>🎹 Number of pieces practiced</h3>
      <p>{piecesPracticedCountString}</p>
    </>
  );
}
