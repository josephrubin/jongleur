import { createRef, useRef, useState } from "react";
import { Link, LinksFunction } from "remix";
import { Timeline } from "~/components/timeline";
import { Waveform } from "~/components/waveform";
import { Spinner } from "~/components/spinner";

export default function PracticeId() {
  const uploadFormRef = createRef<HTMLFormElement>();
  const fileInputRef = createRef<HTMLInputElement>();

  const [currentlyUploading, setCurrentlyUploading] = useState<boolean>(false);

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
      <h1>Your Practice Session</h1>
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
      <h3>Found {segments.length} segments in this practice recording</h3>
      <p>
        Mouse over part of the waveform to see your practice segments. Click on a segment to hear it.
      </p>
      <h3>All of your practice sessions</h3>
      { /* A horizontally scrolling box to contain the session timeline. */ }
      <div className="timeline-container">
        <Timeline selectedNodeIndex={1} />
      </div>
      <form method="POST" encType="multipart/form-data" ref={uploadFormRef}>
        <label>
          <button type="button" disabled={currentlyUploading} onClick={() => fileInputRef.current?.click()}>+ Upload Recording</button>
          <span className="upload-status-hint">{currentlyUploading && <Spinner />}</span>
          <input
            type="file"
            name="recordingFile"
            accept=".ogg"
            ref={fileInputRef}
            style={{display: "none"}}
            onChange={(e) => inputFileOnChange(e, setCurrentlyUploading, uploadFormRef.current)}
          />
        </label>
      </form>
      <p className="hint">
        <br />
        <i>Note you can only upload .ogg files. Use ffmpeg to convert.</i>
        <br />
        <i>Note the waveform and the timeline are scrollable.</i>
      </p>
    </div>
  );
}

function inputFileOnChange(event, setCurrentlyUploading: (v: boolean) => void, form: HTMLFormElement) {
  const files = event.target.files;
  if (files && files.length >= 1 && files[0]) {
    console.log("got file", files[0]);
    setCurrentlyUploading(true);
    form.submit();
  }
}
