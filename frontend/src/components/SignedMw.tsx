import { fmtSignedMw } from "../lib/format";
import { errorSide, SIDE_LABEL } from "../lib/sign";

/** A signed MW figure in the over/under colour; the word is shown too, so colour is never the only cue. */
export function SignedMw({ mw, word = false }: { mw: number | null | undefined; word?: boolean }) {
  const side = errorSide(mw);
  return (
    <span className={`sign sign-${side}`} data-side={side}>
      {fmtSignedMw(mw)}
      {word && side !== "flat" && <small> {SIDE_LABEL[side]}</small>}
    </span>
  );
}
