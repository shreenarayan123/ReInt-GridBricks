import { fmtSignedMw } from "../lib/format";

/** Positive error = forecast above actual. The word is shown too, so colour is never the only cue. */
export function ErrorBadge({ mw }: { mw: number }) {
  const over = mw > 0;
  return (
    <span className={`badge ${over ? "badge-over" : "badge-under"}`}>
      {fmtSignedMw(mw)} <small>{over ? "too high" : mw < 0 ? "too low" : ""}</small>
    </span>
  );
}
