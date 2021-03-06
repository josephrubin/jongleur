import React, { createRef, useEffect, useState } from "react";
import { Segment } from "~/generated/graphql-schema";
import { fillRoundedRect } from "../modules/drawing";

interface WaveformProps {
  // The total height of the rendered waveform in px.
  readonly height: number
  // The waveform samples (usually amplitudes).
  readonly samples: number[]
  // Segment the waveform using each (startIndex, endIndex) pair.
  readonly segments: Segment[]
  // The callback to invoke when a segment is clicked.
  readonly onClickSegment?: (segmentIndex: number) => void
}

/** A visualisaion of a waveform's samples. */
export function Waveform(props: WaveformProps) {
  const canvasRef = createRef<HTMLCanvasElement>();
  const [mouseOverSegmentIndex, setMouseOverSegmentIndex] = useState<number | null>(null);

  const widthPerSample = props.samples.length > 5000 ? 1 : 2;
  const gapBetweenSamples = props.samples.length > 5000 ? 1 : 5;

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
      className={mouseOverSegmentIndex !== null ? "pointer-cursor" : ""}
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
      onClick={
        () => {
          if (mouseOverSegmentIndex !== null && props.onClickSegment) {
            props.onClickSegment(mouseOverSegmentIndex);
          }
        }
      }
    >
      Your browser does not support canvas. Please switch to a newer browser.
    </canvas>
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
  segments: Segment[]
) => {
  const canvasBounds = (event.target as HTMLCanvasElement).getBoundingClientRect();
  const [offsetX, offsetY] = [event.clientX - canvasBounds.left, event.clientY - canvasBounds.top];

  // Find the sample that our mouse is over.
  const mouseOverSampleIndex = Math.floor(offsetX / (widthPerSample + gapBetweenSamples));

  // Find the segment that the sample our mouse is over is in.
  let mouseOverSegmentIndex = null;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (mouseOverSampleIndex >= segment.renderableSampleFirst && mouseOverSampleIndex <= segment.renderableSampleLast) {
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
  segments: Segment[],
  mouseOverSegmentIndex: number | null
) {
  // Height reserved for markings along the bottom.
  const markingsHeight = 18;
  // Number of segments between each notch marking.
  const notchIncrement = 100;
  const waveHeight = height - markingsHeight;

  const outsideSegmentColor = "gray";
  const segmentColors = ["blue", "red", "green"];
  const mouseOverSegmentBoxColor = "#d4f3ff";
  const mouseOverSegmentBoxShadowColor = "gray";
  const textColor = "black";

  // Optionally apply a filter to our samples, mostly so outlier
  // points don't shrink the waveform.
  //amplitudeSamples = amplitudeSamples.map(Math.sqrt);

  // Clip the samples so they aren't too far from the mean. We do this so that
  // outliers do not shrink the entire waveform.
  const mean = amplitudeSamples.reduce((acc, sample) => acc + sample) / amplitudeSamples.length;
  amplitudeSamples = amplitudeSamples.map(sample => Math.min(sample, mean * 5));

  // Normalize the samples so we can draw within our bounds.
  const maxSample = Math.max(...amplitudeSamples);
  const normalizedSamples = amplitudeSamples.map(sample => sample / maxSample);

  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, (widthPerSample + gapBetweenSamples) * amplitudeSamples.length, height);

    // Draw a box around the currently hovered segment.
    if (mouseOverSegmentIndex !== null) {
      const segment = segments[mouseOverSegmentIndex];
      const segmentWidth = (widthPerSample + gapBetweenSamples) * (1 + segment.renderableSampleLast - segment.renderableSampleFirst);
      const segmentX = (widthPerSample + gapBetweenSamples) * (segment.renderableSampleFirst - 0.5);
      ctx.fillStyle = mouseOverSegmentBoxShadowColor;
      fillRoundedRect(ctx, Math.round(segmentX) + 2, 2, Math.round(segmentWidth), waveHeight, 6);
      ctx.fillStyle = mouseOverSegmentBoxColor;
      fillRoundedRect(ctx, Math.round(segmentX), 0, Math.round(segmentWidth), waveHeight, 6);
    }

    // Draw the wave by rendering each sample.
    let currentSegmentIndex = 0;
    for (let i = 0; i < normalizedSamples.length; i++) {
      const sample = normalizedSamples[i];

      // Decide how to color this sample.
      const currentSegment = segments[currentSegmentIndex];
      if (!currentSegment || i < currentSegment.renderableSampleFirst || i > currentSegment.renderableSampleLast) {
        ctx.fillStyle = outsideSegmentColor;
      }
      else {
        ctx.fillStyle = segmentColors[currentSegmentIndex % segmentColors.length];
      }

      // Draw a rectangle to represent this sample.
      const scaledSample = sample * waveHeight;
      const sampleX = i * (gapBetweenSamples + widthPerSample);
      ctx.fillRect(
        1 + sampleX,
        (waveHeight - scaledSample) / 2,
        widthPerSample,
        scaledSample
      );

      // Write the current sample number every few samples.
      if (i % notchIncrement === 0) {
        ctx.fillStyle = textColor;
        ctx.textBaseline = "top";
        ctx.font = "10px Arial";
        // Drawing the text causes an error I've never seen before.
        //ctx.fillText(String(i), sampleX, waveHeight + 1);
      }

      if (currentSegment && i >= currentSegment.renderableSampleLast) {
        currentSegmentIndex++;
      }
    }
  }
}
