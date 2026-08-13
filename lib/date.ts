/**
 * Local-calendar-day YYYY-MM-DD, deliberately not `Date#toISOString()` (which
 * is UTC-based and drifts a day off local "today" for roughly half the
 * globe at any given moment -- e.g. evenings in the Americas are already
 * "tomorrow" in UTC). Every "what's today's date" comparison in the app
 * should go through this so seeded/stored dates and runtime comparisons
 * never disagree about what day it is.
 */
export function localIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
