/** Charts draw on canvas, so they read the CSS tokens in theme.css instead of repeating the hex values. */
const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const chartColors = () => ({
  over: token("--over"),
  under: token("--under"),
  accent: token("--accent"),
  neutral: token("--neutral"),
  text: token("--muted"),
  grid: token("--line"),
});
