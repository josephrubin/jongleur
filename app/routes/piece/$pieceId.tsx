import { createRef, useRef, useState } from "react";
import { Link, LinksFunction, LoaderFunction, Outlet, redirect, useCatch, useLoaderData } from "remix";
import { PracticeSubset, Timeline } from "~/components/timeline";
import { Waveform } from "~/components/waveform";
import { Spinner } from "~/components/spinner";
import { MAKE_PRESIGNED_UPLOAD_URL_ENDPOINT } from "~/modules/audio.server";
import { useAccessToken } from "~/modules/session";
import { Piece } from "~/generated/graphql-schema";
import { readMyPractices } from "~/modules/practices.server";
import { getAccessToken, redirectToLoginIfNull } from "~/modules/session.server";
import { readPiece } from "~/modules/pieces.server";
import { makeScarlattiPieceLabel } from "~/modules/pieces";
import { makePracticeUrl } from "~/modules/practices";

interface LoaderData {
  // The Piece we are viewing.
  readonly piece: Piece;
  // All user Practices of this piece.
  readonly practices: PracticeSubset[];
  // The HTTP endpoint to hit to get a presigned URL for audio upload.
  // We need to get this from the server since it's in an env variable
  // but the upload will be done client side.
  readonly makePresignedUploadUrlEndpoint: string;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const accessToken = redirectToLoginIfNull(await getAccessToken(request));

  const pieceId = params.pieceId;
  if (!pieceId) {
    throw "Impossible - pieceId is guaranteed by route params but not found.";
  }

  const piece = await readPiece({ id: pieceId });
  if (piece === null) {
    throw new Response("Piece Not Found", {
      status: 404,
    });
  }

  // Get a list of all the practices of this piece with very barebones information,
  // just so we can make the timeline (sorted by when they were uploaded, first to last).
  const practices = (await readMyPractices({
    accessToken: accessToken,
  })).filter(
    practice => practice.piece.id === pieceId
  ).sort(
    (practiceOne, practiceTwo) => Number(practiceOne.uploadEpoch) - Number(practiceTwo.uploadEpoch)
  );

  // If there is a (most recent) practice, but we are not yet viewing a practice,
  // just go directly to it!
  if (practices.length > 0 && !params.practiceId) {
    throw redirect(makePracticeUrl(practices[0]));
  }

  return {
    piece: piece,
    practices: practices,
    makePresignedUploadUrlEndpoint: MAKE_PRESIGNED_UPLOAD_URL_ENDPOINT,
  };
};

type UploadState = "Ready" | "Uploading" | "Done" | "Error";

export default function PieceId() {
  const { piece, practices, makePresignedUploadUrlEndpoint } = useLoaderData<LoaderData>();
  const accessToken = useAccessToken();

  const uploadFormRef = createRef<HTMLFormElement>();
  const fileInputRef = createRef<HTMLInputElement>();

  const [uploadState, setUploadState] = useState<UploadState>("Ready");

  return (
    <div className="practice-session-container">
      <h1>{makeScarlattiPieceLabel(piece)}</h1>

      {practices.length > 0
        ? (
          <>
            <Outlet />

            <h3>All of your practice sessions</h3>
            { /* A horizontally scrolling box to contain the session timeline. */ }
            <div className="timeline-container">
              <Timeline practices={practices} />
            </div>
          </>
        )
        : (
          <>
            <b>{"You haven't practiced this piece yet."}</b>
            <p>Upload a recording to see the magic.</p>
          </>
        )
      }

      { /* Upload recording button and hidden form. */ }
      <form method="POST" encType="multipart/form-data" ref={uploadFormRef}>
        <label>
          <button type="button" disabled={uploadState !== "Ready"} onClick={() => fileInputRef.current?.click()}>+ Upload Recording</button>
          { /* If we are uploading, add a Spinner. */ }
          <span className="upload-status-hint">{uploadState === "Uploading" && <Spinner />}</span>
          { /* If there was an error, just tell the user. Not much else to do. */ }
          <span className="upload-status-hint">{uploadState === "Error" && <span className="error">Error ocurred during upload.</span>}</span>
          { /* If there was a successful upload, we would love to be able to show the processing progress.
             * Right now we don't have a way to do that, so just tell them to wait a bit and refresh the page. */ }
          <span className="upload-status-hint">{uploadState === "Done" && <span>✅ Upload complete! Refresh the page in a few minutes to see it.</span>}</span>
          <input
            type="file"
            name="recordingFile"
            accept=".ogg"
            ref={fileInputRef}
            style={{display: "none"}}
            onChange={
              (e) => inputFileOnChange(
                e,
                makePresignedUploadUrlEndpoint,
                { accessToken: accessToken, pieceId: piece.id },
                setUploadState,
                uploadFormRef.current
              )
            }
          />
        </label>
      </form>
      <p className="hint">
        <br />
        <i>Note you can only upload .ogg files. Use ffmpeg to convert.</i>
      </p>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div>
        <h1>{"404: Can't find that piece."}</h1>
        <p>
          Please try another piece.
        </p>
      </div>
    );
  }

  throw caught;
}

/** If the form's file input has a file, submit the form programmatically. */
async function inputFileOnChange(
  event: React.ChangeEvent<HTMLInputElement>,
  makePresignedUploadUrlEndpoint: string,
  makePresignedUploadUrlRequestData: object,
  setUploadState: (state: UploadState) => void,
  form: HTMLFormElement | null
) {
  if (form) {
    const files = event.target.files;
    if (files && files.length >= 1 && files[0]) {
      try {
        setUploadState("Uploading");

        // Client uploading of audio files has two parts.
        // 1. Get a presigned URL.
        const response = await fetch(makePresignedUploadUrlEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(makePresignedUploadUrlRequestData),
        });
        if (response.status !== 200) {
          setUploadState("Error");
          return;
        }

        // 2. Now that we have a presigned URL, PUT the audio file at the URL.
        // Note: we don't use FormData because we want to post only the audio bytes.
        const responseData = await response.json();
        const putResponse = await fetch(responseData.signedUrl, {
          method: "PUT",
          body: await files[0].arrayBuffer(),
        });
        if (putResponse.status === 200) {
          setUploadState("Done");
        }
        else {
          setUploadState("Error");
        }
      }
      catch {
        setUploadState("Error");
      }
    }
  }
}
