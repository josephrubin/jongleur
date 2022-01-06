import { createRef, useRef, useState } from "react";
import { Link, LinksFunction, LoaderFunction, useLoaderData } from "remix";
import { PracticeSubset, Timeline } from "~/components/timeline";
import { Waveform } from "~/components/waveform";
import { Spinner } from "~/components/spinner";
import { MAKE_PRESIGNED_UPLOAD_URL_ENDPOINT } from "~/modules/audio.server";
import { useAccessToken } from "~/modules/session";
import { Practice } from "~/generated/graphql-schema";
import { readMyPractice, readMyPractices } from "~/modules/practices.server";
import { getAccessToken, redirectToLoginIfNull } from "~/modules/session.server";

interface LoaderData {
  // The Practice we are viewing.
  readonly practice: Practice;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const accessToken = redirectToLoginIfNull(await getAccessToken(request));

  const pieceId = params.pieceId;
  const practiceId = params.practiceId;
  if (!pieceId || !practiceId) {
    throw "Impossible - pieceId and practiceId are guaranteed by route params but not found.";
  }

  // Get the practice we are displaying on this page with all of its information.
  const practice = await readMyPractice({ accessToken }, { id: pieceId });

  return {
    practice: practice,
  };
};

export default function PracticeId() {

  let samples = [3, 5, 3, 7, 8, 5, 3, 2, 3, 4, 1, 2, 1, 2, 7, 8, 7, 5, 7, 4, 4, 6, 7, 6, 1, 4, 3, 4, 4, 5];
  samples = samples.concat(samples, samples, samples, samples, samples, samples);

  const segments = [
    {startIndex: 0, endIndex: 9},
    {startIndex: 14, endIndex: 23},
    {startIndex: 25, endIndex: 29},
    {startIndex: 30, endIndex: 35},
    {startIndex: 56, endIndex: 60},
  ];

  return (
    <div className="practice-session-container">
      <h2>Your Practice Session</h2>
      { /* A horizontally scrolling box to contain the practice waveform. */ }
      <div className="waveform-container">
        <Waveform
          height={148}
          samples={samples}
          segments={segments}
          onClickSegment={(i) => {console.log(i);}}
        />
      </div>
      <p className="practice-summary">
        # hours of practice · # average segment length · #bpm approximate tempo · # hours on this piece in total
      </p>
      <b>Found {segments.length} segments in this practice recording</b>
      <p>
        Mouse over part of the waveform to see your practice segments. Click on a segment to hear it.
      </p>
    </div>
  );
}
