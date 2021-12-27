import React, { createRef, useEffect, useState } from "react";

interface SegmentIndices {
  readonly startIndex: number;
  readonly endIndex: number;
}

interface WaveformProps {
  // The total height of the rendered waveform in px.
  readonly height: number
  // The waveform samples (usually amplitudes).
  readonly samples: number[]
  // Segment the waveform using each (startIndex, endIndex) pair.
  readonly segments: SegmentIndices[]
}

/** A visualisaion of a waveform's samples. */
export function Waveform(props: WaveformProps) {
  const canvasRef = createRef<HTMLCanvasElement>();
  const [mouseOverSegmentIndex, setMouseOverSegmentIndex] = useState<number | null>(null);

  const widthPerSample = 2;
  const gapBetweenSamples = 5;

  useEffect(() => {
    if (canvasRef.current) {
      drawWaveform(
        canvasRef.current,
        props.height,
        widthPerSample,
        gapBetweenSamples,
        props.samples,
        props.segments,
        mouseOverSegmentIndex
      );
    }
  });

  return (
    <canvas
      ref={canvasRef}
      height={props.height}
      width={(widthPerSample + gapBetweenSamples) * props.samples.length}
      onMouseMove={
        (event) => void setMouseOverSegmentIndex(
          mouseOverWaveform(event,
            widthPerSample,
            gapBetweenSamples,
            props.segments
          )
        )
      }
      onMouseOut={
        () => void setMouseOverSegmentIndex(null)
      }
    ></canvas>
  );
}

/**
 * Called when the mouse is over the waveform. Return the segment that
 * the mouse is over, or null if the mouse is not over a segment.
 */
const mouseOverWaveform = (
  event: React.MouseEvent<Element, MouseEvent>,
  widthPerSample: number,
  gapBetweenSamples: number,
  segments: SegmentIndices[]
) => {
  const canvasBounds = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const [offsetX, offsetY] = [event.clientX - canvasBounds.left, event.clientY - canvasBounds.top];

  // Find the sample that our mouse is over.
  const mouseOverSampleIndex = Math.floor(offsetX / (widthPerSample + gapBetweenSamples));

  // Find the segment that the sample our mouse is over is in.
  let mouseOverSegmentIndex = null;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (mouseOverSampleIndex >= segment.startIndex && mouseOverSampleIndex <= segment.endIndex) {
      mouseOverSegmentIndex = i;
      break;
    }
  }

  return mouseOverSegmentIndex;
};

/** Render the samples as amplitudes to a canvas. */
function drawWaveform(
  canvas: HTMLCanvasElement,
  height: number,
  widthPerSample: number,
  gapBetweenSamples: number,
  amplitudeSamples: number[],
  segments: SegmentIndices[],
  mouseOverSegmentIndex: number | null
) {
  const outsideSegmentColor = "gray";
  const segmentColors = ["blue", "red", "yellow", "green"];

  // Optionally apply a filter to our samples, mostly so outlier
  // points don't shrink the waveform.
  //amplitudeSamples = amplitudeSamples.map(Math.sqrt);

  // Normalize the samples so we can draw within our bounds.
  const maxSample = Math.max(...amplitudeSamples);
  const normalizedSamples = amplitudeSamples.map(sample => sample / maxSample);

  const ctx = canvas.getContext("2d");
  if (ctx) {
    let currentSegmentIndex = 0;
    normalizedSamples.forEach((sample, index) => {
      // Decide how to color this sample.
      const currentSegment = segments[currentSegmentIndex];
      if (!currentSegment || index < currentSegment.startIndex || index > currentSegment.endIndex) {
        ctx.fillStyle = outsideSegmentColor;
      }
      else {
        if (mouseOverSegmentIndex !== null && mouseOverSegmentIndex === currentSegmentIndex) {
          ctx.fillStyle = "purple";
        }
        else {
          ctx.fillStyle = segmentColors[currentSegmentIndex % segmentColors.length];
        }
      }

      // Draw a rectangle to represent this sample.
      const scaledSample = sample * height;
      ctx.fillRect(
        index * (gapBetweenSamples + widthPerSample),
        (height - scaledSample) / 2,
        widthPerSample,
        scaledSample
      );

      if (currentSegment && index >= currentSegment.endIndex) {
        currentSegmentIndex++;
      }
    });
  }
}
