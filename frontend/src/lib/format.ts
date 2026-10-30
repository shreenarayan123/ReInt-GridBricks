const mw = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

export const fmtMw = (v: number | null | undefined) =>
  v == null ? "–" : `${mw.format(Math.round(v))} MW`;

/** Always shows the sign, so over- and under-forecasts read differently at a glance. */
export const fmtSignedMw = (v: number | null | undefined) => {
  if (v == null) return "–";
  const r = Math.round(v);
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${mw.format(Math.abs(r))} MW`;
};

const ukDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short",
});
const ukDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});

export const fmtUkDate = (iso: string) => ukDate.format(new Date(iso));
export const fmtUkDateTime = (iso: string) => `${ukDateTime.format(new Date(iso))} UK`;
