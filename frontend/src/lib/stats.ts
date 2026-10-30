const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Is the previous delivery day's slot already finished at the decision time?
 * The decision is made the day before delivery at `cutoff`, and the previous day's slot
 * ends at slot + 30 min that same day. A 09:20 cutoff therefore never sees a 12:00 slot.
 */
export const previousDayVisible = (cutoff: string, slot: string, lagMinutes = 0) =>
  minutes(cutoff) >= minutes(slot) + 30 + lagMinutes;
