// Library (MIT license) to make a text string from a number.
// https://www.npmjs.com/package/number-to-text
// This is basicaly the only boutique npm library we depend on.
import * as numberToText from "number-to-text";
require("number-to-text/converters/en-us");

/**
 * Turn a number of seconds into a string like:
 * `Seven hours`
 * `Seventy two minutes`
 * Horus will be chosen unless the number of hours is small.
 */
export function secondsToMinutesOrHoursString(seconds: number) {
  const minutes = seconds / 60;
  const hours = minutes / 60;
  return hours < 3
    ? `${roundToTextSentenceCase(minutes)} ${Math.ceil(minutes) === 1 ? "minute" : "minutes"}`
    : `${roundToTextSentenceCase(hours)} ${Math.ceil(hours) === 1 ? "hour" : "hours"}`;
}

/**
 * Round a number and produce a text string that represent the
 * number in sentence case, like:
 * `Seventy one`
 */
export function roundToTextSentenceCase(value: number) {
  const text = numberToText.convertToText(Math.ceil(value));
  return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
}
