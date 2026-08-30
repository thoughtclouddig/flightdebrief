/**
 * Recording consent and data retention -- the trust layer.
 *
 * A debrief records two people, one of whom is an employee of the school
 * buying the software. Every serious objection a chief instructor raises
 * ("who consented?", "where does the audio live?", "what happens when a
 * lawyer subpoenas it?") has to have a short, true answer, and the answers
 * have to be provable from data rather than asserted in a policy page.
 *
 * The strongest answer is architectural, and it already existed before this
 * module did: AFTERFLIGHT NEVER STORES THE RECORDING. The browser streams
 * microphone chunks straight to the transcription provider over a live
 * socket (lib/transcription/use-deepgram-transcription.ts) and drops them;
 * no audio blob is POSTed here and `debriefs` has no audio column. There is
 * no archive to subpoena because there is no archive.
 *
 * What IS retained is the transcript -- the verbatim conversation as text --
 * and the structured result derived from it. Those are different things and
 * this module treats them differently: the transcript ages out on a
 * configurable schedule, the structured result does not, because the
 * structured result IS the student's training record and deleting it would
 * destroy the history the product exists to preserve.
 */

/**
 * Bumped whenever the consent text a user is shown changes materially.
 * Consent rows store the version accepted, so an old recording always
 * resolves to the terms actually presented at the time -- never to whatever
 * the current text happens to say.
 */
export const CONSENT_POLICY_VERSION = "2026-08-30";

/**
 * Consent capture already existed before this module: consent_records holds
 * one row per participant per flight, written by
 * app/api/flights/[id]/debrief/consent/route.ts BEFORE recording starts, with
 * the copy shown in components/debrief/recording-consent.tsx. What was
 * missing is a version stamp -- proving somebody consented is only half the
 * artifact if you cannot show which text they agreed to. Hence the constant
 * above and the policy_version column.
 */

/**
 * Default transcript retention. Deliberately not written into user-facing
 * copy as a fixed promise -- orgs can override it, and baking "365 days" into
 * a sentence makes the number impossible to change later without the copy
 * lying. Render the org's effective value instead.
 */
export const DEFAULT_TRANSCRIPT_RETENTION_DAYS = 365;

/** Orgs may disable transcript expiry entirely; null means "keep indefinitely". */
export function effectiveRetentionDays(orgSetting: number | null | undefined): number | null {
  if (orgSetting === null) return null;
  if (orgSetting === undefined) return DEFAULT_TRANSCRIPT_RETENTION_DAYS;
  return orgSetting;
}

/** Whether a transcript recorded at `createdAt` is past its retention window. */
export function isTranscriptExpired(createdAt: Date, retentionDays: number | null, now: Date): boolean {
  if (retentionDays === null) return false;
  const ageMs = now.getTime() - createdAt.getTime();
  return ageMs > retentionDays * 24 * 60 * 60 * 1000;
}

/**
 * What a school owner is actually asking when they ask "where does the audio
 * live?". Kept as data rather than prose so the same answers render in the
 * admin UI and can be quoted in a sales conversation without drift.
 */
export const DATA_HANDLING_FACTS: { question: string; answer: string }[] = [
  {
    question: "Where does the audio live?",
    answer:
      "Nowhere. The recording is streamed from the browser to the transcription service as it happens and is never written to AfterFlight's servers or database. There is no audio file to retrieve, export, or subpoena.",
  },
  {
    question: "What is actually kept?",
    answer:
      "The transcript of the debrief, and the structured training record built from it -- what was worked on, what went well, what needs work, and what carries into the next lesson.",
  },
  {
    question: "Who can see it?",
    answer:
      "The student, the instructor on that flight, and staff at that school. Records are scoped to one organization and are not shared between schools.",
  },
  {
    question: "When is the transcript deleted?",
    answer:
      "On your school's retention schedule. When it expires, the verbatim transcript is cleared and the structured training record remains, so the student keeps their history without the raw conversation being held indefinitely.",
  },
  {
    question: "Who can delete it sooner?",
    answer:
      "A school administrator, at any time, for any debrief or any student.",
  },
  {
    question: "Who consented, and can you prove it?",
    answer:
      "Students consent when they join; instructors acknowledge when they are added as staff. Each acceptance is stored with the person, the school, the exact policy version, and the timestamp -- so consent can be shown to have existed at the time of any given recording.",
  },
];
