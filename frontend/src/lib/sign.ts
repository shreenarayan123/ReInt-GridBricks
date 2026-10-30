/** Error = forecast − actual: red means the forecast was too high, orange too low. */
export type Side = "high" | "low" | "flat";

/** Rounds to whole MW first, so a displayed "0 MW" is never coloured as an over- or under-forecast. */
export const errorSide = (mw: number | null | undefined): Side => {
  if (mw == null) return "flat";
  const r = Math.round(mw);
  return r > 0 ? "high" : r < 0 ? "low" : "flat";
};

export const SIDE_LABEL: Record<Side, string> = { high: "too high", low: "too low", flat: "on target" };

/** CSS custom property (see theme.css) that carries the colour for each side. */
export const SIDE_TOKEN: Record<Side, string> = { high: "--over", low: "--under", flat: "--neutral" };
