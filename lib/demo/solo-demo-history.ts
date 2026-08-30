/**
 * The solo pilot demo's own flight history.
 *
 * Not DEMO_HISTORY. That set is a student's, and it says so -- "Sarah had me
 * focus on getting configured earlier", "Sarah pointed out I'm still
 * drifting off centerline". Seeding it under a persona who has no instructor
 * produced a debrief record quoting a CFI who was never on the flight, which
 * is the one thing this product must never do: the whole premise is that
 * what it shows you actually happened.
 *
 * Same shape and the same arc as the student set's last five -- approach
 * speed becoming a strength, radio confidence settling, flare timing and
 * centerline narrowing into the one theme that persists -- because the
 * recurring-themes card needs a repeated skill to have anything to show.
 * What changes is the voice: a certificated pilot debriefing themselves,
 * noticing their own errors, with nobody in the right seat.
 */
export const SOLO_DEMO_HISTORY: { daysAgo: number; durationMinutes: number; transcript: string }[] = [
  {
    daysAgo: 29,
    durationMinutes: 76,
    transcript:
      "Went out to practice go-arounds and normal landings. Felt good on the radio, handled a runway change from tower without hesitating. Still ballooning a little in the flare when I round out too high.",
  },
  {
    daysAgo: 23,
    durationMinutes: 71,
    transcript:
      "Good session overall. Checklist discipline was consistent through the whole flight. Approach speed control has become a strength. Noticed I'm still drifting off centerline a bit during rollout.",
  },
  {
    daysAgo: 17,
    durationMinutes: 73,
    transcript:
      "Worked crosswind landings on my own. Airspeed on final was right where it needed to be all four landings. Radio calls were confident and clear. Flare timing is still inconsistent -- ballooned once, landed flat once.",
  },
  {
    daysAgo: 12,
    durationMinutes: 69,
    transcript:
      "Pattern work with a focus on stabilized approaches. Getting configured earlier is paying off -- speed control is consistent now. Centerline control after touchdown still needs work, especially in any crosswind.",
  },
  {
    daysAgo: 6,
    durationMinutes: 75,
    transcript:
      "Solid flight. Checklist usage is second nature now. Radio calls are confident, no repeats needed all flight. Still working on nailing the flare timing to avoid ballooning and holding centerline through rollout.",
  },
];
