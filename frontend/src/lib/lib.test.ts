import { describe, expect, it } from "vitest";
import { fmtMw, fmtSignedMw } from "./format";
import { histogram, previousDayVisible } from "./stats";
import { DEFAULTS, parseUrlState, toSearch } from "./urlState";

describe("format", () => {
  it("formats MW with thousands separators and signs", () => {
    expect(fmtMw(6821)).toBe("6,821 MW");
    expect(fmtSignedMw(5353)).toBe("+5,353 MW");
    expect(fmtSignedMw(-59)).toBe("−59 MW");
    expect(fmtSignedMw(null)).toBe("–");
  });
});

describe("previousDayVisible", () => {
  it("is false at a 09:20 cutoff for a 12:00 slot, true at 19:00", () => {
    expect(previousDayVisible("09:20", "12:00")).toBe(false);
    expect(previousDayVisible("19:00", "12:00")).toBe(true);
  });
  it("needs the slot to have ended (12:30) plus lag", () => {
    expect(previousDayVisible("12:30", "12:00")).toBe(true);
    expect(previousDayVisible("12:29", "12:00")).toBe(false);
    expect(previousDayVisible("12:30", "12:00", 5)).toBe(false);
  });
});

describe("histogram", () => {
  it("bins values aligned to the bin width, including negatives", () => {
    const h = histogram([-1200, -100, 50, 120, 980, 1010], 1000);
    expect(h.labels).toEqual(["-2000", "-1000", "0", "1000"]);
    expect(h.counts).toEqual([1, 1, 3, 1]);
  });
  it("handles empty input", () => {
    expect(histogram([], 500).counts).toEqual([]);
  });
});

describe("url state", () => {
  it("round-trips", () => {
    const s = { ...DEFAULTS, view: "profile" as const, cutoff: "10:00", days: 3 };
    expect(parseUrlState(toSearch(s))).toEqual(s);
  });
  it("maps the legacy evaluation view to overview", () => {
    expect(parseUrlState("?view=evaluation").view).toBe("overview");
  });
  it("falls back to defaults on bad values", () => {
    const s = parseUrlState("?date=nope&slot=25:99&days=500&cutoff=abc&view=x");
    expect(s).toEqual(DEFAULTS);
  });
});
