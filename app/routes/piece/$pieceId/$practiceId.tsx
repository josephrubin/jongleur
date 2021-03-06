import { useEffect, useState } from "react";
import { LoaderFunction, useLoaderData } from "remix";
import { Waveform } from "~/components/waveform";
import { Practice } from "~/generated/graphql-schema";
import { readMyPractice } from "~/modules/practices.server";
import { getAccessToken, redirectToLoginIfNull } from "~/modules/session.server";
import { secondsToMinutesOrHoursString } from "~/modules/stats";

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
  const practice = await readMyPractice({ accessToken }, { id: practiceId });

  return {
    practice: practice,
  };
};

export default function PracticeId() {
  const { practice } = useLoaderData<LoaderData>();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const segments = practice.segments;

  const averageSegmentDurationSeconds = segments.reduce(
    (acc, segment) => acc + segment.durationSeconds, 0
  ) / segments.length;

  function stopPlayingAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
    }
  }

  useEffect(
    // Cleanup callback. Stop playing when this component is destroyed.
    () => stopPlayingAudio
  );

  return (
    <div className="practice-session-container">
      <h2>Your Practice Session</h2>
      { /* A horizontally scrolling box to contain the practice waveform. */ }
      <div className="waveform-container">
        <Waveform
          height={148}
          samples={practice.renderableWaveform}
          segments={segments}
          onClickSegment={
            (i) => {
              stopPlayingAudio();

              // Play the audio associated with this segment.
              const audio = new Audio(segments[i].audioUrl);
              audio.play();
              setCurrentAudio(audio);
            }
          }
        />
      </div>
      <p className="practice-summary">
        {secondsToMinutesOrHoursString(practice.durationSeconds)} of practice{" ?? "}
        {secondsToMinutesOrHoursString(averageSegmentDurationSeconds)} average segment length{" ?? "}
        {practice.tempoBpm}bpm approximate tempo
      </p>
      <b>Found {segments.length} {segments.length === 1 ? "segment" : "segments"} in this practice recording</b>
      <p>
        Mouse over the waveform to see your practice segments (it scrolls horizontally). Click on a segment to hear it.
      </p>
    </div>
  );
}
