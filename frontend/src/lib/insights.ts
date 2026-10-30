import { fmtMw, fmtSignedMw } from "./format";

/** The buffer card's one sentence: the 90th percentile of absolute error over the history window. */
export const bufferSentence = (p90AbsMw: number | null | undefined) =>
  p90AbsMw == null ? null : `Error stayed within ${fmtMw(p90AbsMw)} on 90% of days`;

export const SMALL_SAMPLE = 10;

export interface HourStat {
  hour: number;
  bias_mw?: number | null;
  mae_mw?: number | null;
}

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** One-line summary of the by-hour chart, computed from the same data. */
export function hourTakeaway(hours: HourStat[]): string | null {
  const biased = hours.filter((h) => h.bias_mw != null);
  const withMae = hours.filter((h) => h.mae_mw != null);
  if (biased.length === 0 || withMae.length === 0) return null;
  const high = biased.filter((h) => Math.round(h.bias_mw!) > 0).length;
  const low = biased.filter((h) => Math.round(h.bias_mw!) < 0).length;
  const worst = withMae.reduce((a, b) => (b.mae_mw! > a.mae_mw! ? b : a));
  const best = withMae.reduce((a, b) => (b.mae_mw! < a.mae_mw! ? b : a));
  const direction =
    low === 0 ? `Forecast was too high in ${high} of ${biased.length} hours`
    : high === 0 ? `Forecast was too low in ${low} of ${biased.length} hours`
    : `Forecast was too high in ${high} and too low in ${low} of ${biased.length} hours`;
  return `${direction}; error is largest at ${hh(worst.hour)} (MAE ${fmtMw(worst.mae_mw)}) and smallest at ${hh(best.hour)} (${fmtMw(best.mae_mw)}).`;
}

/** Positive `better` means the later decision time had the lower MAE. */
export function maeDifference(early: number | null | undefined, late: number | null | undefined) {
  if (early == null || late == null) return null;
  const better = early - late;
  return { better, text: fmtSignedMw(late - early) };
}
