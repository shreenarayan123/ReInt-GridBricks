// WINDFOR forecasts are hourly, so only on-the-hour slots can have a forecast.
const SLOTS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export function SlotPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>Slot (UK)</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  );
}
