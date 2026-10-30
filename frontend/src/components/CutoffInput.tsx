import { useEffect, useState } from "react";

const VALID = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Time input that commits to the URL (and so triggers a fetch) only after the user pauses. */
export function CutoffInput({ label, value, onChange, delayMs = 400 }: {
  label: string; value: string; onChange: (v: string) => void; delayMs?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [seen, setSeen] = useState(value);

  // Follow external changes (back button, links) by adjusting state during render.
  if (value !== seen) {
    setSeen(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value || !VALID.test(draft)) return;
    const id = setTimeout(() => onChange(draft), delayMs);
    return () => clearTimeout(id);
  }, [draft, value, onChange, delayMs]);

  return (
    <label className="field">
      <span>{label}</span>
      <input type="time" value={draft} onChange={(e) => setDraft(e.target.value)} />
    </label>
  );
}
