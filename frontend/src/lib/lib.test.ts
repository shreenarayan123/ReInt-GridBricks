import { describe, expect, it } from "vitest";
import { fmtMw, fmtSignedMw } from "./format";
import { bufferSentence, hourTakeaway, maeDifference } from "./insights";
import { errorSide, SIDE_TOKEN } from "./sign";
import { previousDayVisible } from "./stats";
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

describe("buffer sentence", () => {
  it("states the P90 absolute error in MW", () => {
    expect(bufferSentence(4974)).toBe("Error stayed within 4,974 MW on 90% of days");
    expect(bufferSentence(null)).toBeNull();
  });
});

describe("sign and colour", () => {
  it("positive error is too high (orange), negative too low (blue)", () => {
    expect(errorSide(5353)).toBe("high");
    expect(errorSide(-59)).toBe("low");
    expect(SIDE_TOKEN[errorSide(5353)]).toBe("--over");
    expect(SIDE_TOKEN[errorSide(-59)]).toBe("--under");
  });
  it("treats values that round to 0 MW, and missing values, as flat", () => {
    expect(errorSide(0.4)).toBe("flat");
    expect(errorSide(-0.4)).toBe("flat");
    expect(errorSide(null)).toBe("flat");
  });
});

describe("hourTakeaway", () => {
  it("summarises direction and best/worst hour", () => {
    const t = hourTakeaway([
      { hour: 0, bias_mw: 100, mae_mw: 1500 },
      { hour: 1, bias_mw: 300, mae_mw: 2500 },
      { hour: 2, bias_mw: -50, mae_mw: 900 },
    ]);
    expect(t).toBe("Forecast was too high in 2 and too low in 1 of 3 hours; error is largest at 01:00 (MAE 2,500 MW) and smallest at 02:00 (900 MW).");
  });
  it("says too high when every hour is positive, and handles no data", () => {
    expect(hourTakeaway([{ hour: 5, bias_mw: 10, mae_mw: 20 }])).toMatch(/^Forecast was too high in 1 of 1 hours/);
    expect(hourTakeaway([])).toBeNull();
  });
});

describe("maeDifference", () => {
  it("is positive when the later decision time is more accurate", () => {
    expect(maeDifference(2022, 1672)).toEqual({ better: 350, text: "−350 MW" });
    expect(maeDifference(null, 1)).toBeNull();
  });
});

describe("url state", () => {
  it("round-trips", () => {
    const s = { ...DEFAULTS, view: "hours" as const, cutoff: "10:00", days: 3 };
    expect(parseUrlState(toSearch(s))).toEqual(s);
  });
  it("maps legacy views: evaluation and compare to overview, profile to hours", () => {
    expect(parseUrlState("?view=evaluation").view).toBe("overview");
    expect(parseUrlState("?view=compare").view).toBe("overview");
    expect(parseUrlState("?view=profile").view).toBe("hours");
  });
  it("defaults to 14 history days", () => {
    expect(DEFAULTS.days).toBe(14);
  });
  it("falls back to defaults on bad values", () => {
    const s = parseUrlState("?date=nope&slot=25:99&days=500&cutoff=abc&view=x");
    expect(s).toEqual(DEFAULTS);
  });
});
