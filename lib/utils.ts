import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function formatDurationShort(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

/** A debrief recording's length, e.g. 72 -> "1:12". Seconds, not minutes -- do not hand this to formatDurationShort. */
export function formatAudioDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** ISO "YYYY-MM-DD" -> "Aug 20" -- the T12:00:00 avoids UTC/local rollover shifting the day. */
export function formatFlightDate(flightDate: string) {
  return new Date(flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Shared "which flight is this" line shown on every debrief screen (waiting
 * room, task picker, both assessment forms, results). Always includes the
 * date AND duration -- a bare tail number/route is ambiguous once a student
 * has more than one flight on the same aircraft (even same day), which real
 * seeded flight data hits fast.
 */
export function formatFlightContext(flight: {
  aircraft: { tailNumber: string };
  departureAirport: string;
  arrivalAirport: string;
  flightDate: string;
  durationMinutes: number;
}) {
  return `${flight.aircraft.tailNumber} · ${flight.departureAirport} → ${flight.arrivalAirport} · ${formatFlightDate(flight.flightDate)} · ${formatDurationShort(flight.durationMinutes)}`;
}
