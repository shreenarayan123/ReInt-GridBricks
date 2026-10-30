import { fmtMw, fmtSignedMw } from "./format";

/** The buffer card's one sentence: the 90th percentile of absolute error over the history window. */
export const bufferSentence = (p90AbsMw: number | null | undefined) =>
  p90AbsMw == null ? null : `Error stayed within ${fmtMw(p90AbsMw)} on 90% of days`;

export const SMALL_SAMPLE = 10;

/** Positive `better` means the later decision time had the lower MAE. */
export function maeDifference(early: number | null | undefined, late: number | null | undefined) {
  if (early == null || late == null) return null;
  const better = early - late;
  return { better, text: fmtSignedMw(late - early) };
}
