import type { StructuredDebrief } from "@/lib/types";

/**
 * Fixed, deterministic identifiers for the Video Demo Mode persona and
 * dataset (see lib/demo/video-demo-seed.ts). Fixed on purpose -- every
 * scene's URL in components/demo/demo-control-panel.tsx is a hardcoded
 * string built from these, so a reset always reproduces the exact same
 * links across takes instead of requiring a fresh lookup each time.
 */
export const DEMO_ORG_ID = "org-video-demo";
export const DEMO_AIRCRAFT_ID = "aircraft-video-demo-da40";
export const DEMO_STUDENT_ID = "user-video-demo-alex";
export const DEMO_INSTRUCTOR_ID = "user-video-demo-sarah";
/** The one flight scenes 1-6 walk through -- undebriefed until the live recording take completes it. */
export const DEMO_FLIGHT_ID = "flight-video-demo-today";
export const DEMO_STUDENT_EMAIL = "demo-alex-morgan@afterflight.internal";
export const DEMO_INSTRUCTOR_EMAIL = "demo-sarah-mitchell@afterflight.internal";

export const DEMO_STUDENT_NAME = "Alex Morgan";
export const DEMO_INSTRUCTOR_NAME = "Sarah Mitchell";
export const DEMO_AIRCRAFT_TAIL = "N842DA";
export const DEMO_AIRCRAFT_TYPE = "Diamond DA40 NG";
export const DEMO_AIRPORT = "KSDL";
export const DEMO_ORG_NAME = "Scottsdale Flight Academy";
export const DEMO_TODAY_DURATION_MINUTES = 72; // 1.2 hours

/**
 * Historical flights feeding Scene 8 (/history) and the recurring-themes /
 * skill-progression logic that Scene 7 (/next-lesson) and Scene 9
 * (/cfi/students/[id]) derive from. Ordered oldest-first; daysAgo spreads
 * them across ~7 weeks so /history reads as a real student who has been
 * flying regularly, and the transcripts build a plausible arc converging on
 * exactly the "still needs work" theme the curated today's-flight debrief
 * (below) opens with -- floating/fast approaches, then narrowing to flare
 * and centerline control specifically.
 */
export const DEMO_HISTORY: { daysAgo: number; durationMinutes: number; transcript: string }[] = [
  {
    daysAgo: 49,
    durationMinutes: 68,
    transcript:
      "First flight in the pattern at Scottsdale. My landings were rough -- carrying too much speed on final and floating almost every time. Sarah had me focus on getting configured earlier downwind. Radio calls were shaky, missed one call from tower.",
  },
  {
    daysAgo: 45,
    durationMinutes: 70,
    transcript:
      "Back in the pattern. Still floating on landing but not as much as last time. Sarah wants me trimming for approach speed earlier. Radio calls were better, only needed one repeat.",
  },
  { daysAgo: 40, durationMinutes: 74, transcript: "Worked slow flight and steep turns today. Altitude control on the steep turns was solid. Landings were closer to on-speed but I'm still floating a little before touchdown." },
  {
    daysAgo: 35,
    durationMinutes: 66,
    transcript:
      "Pattern work again, more landings than usual. Airspeed control on final is noticeably better -- not carrying the extra five to ten knots like before. Checklist flow is getting smoother, didn't miss a step this time.",
  },
  {
    daysAgo: 29,
    durationMinutes: 76,
    transcript:
      "Practiced go-arounds and normal landings. Radio confidence is much better, handled a runway change from tower without hesitating. Still ballooning a little in the flare when I round out too high.",
  },
  {
    daysAgo: 23,
    durationMinutes: 71,
    transcript:
      "Good session overall. Checklist discipline was consistent through the whole flight. Approach speed control has become a strength. Sarah pointed out I'm still drifting off centerline a bit during rollout.",
  },
  {
    daysAgo: 17,
    durationMinutes: 73,
    transcript:
      "Worked crosswind landings. Airspeed on final was right where it needed to be all four landings. Radio calls were confident and clear. Flare timing is still inconsistent -- ballooned once, landed flat once.",
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

/**
 * Scene 6's curated result -- deliberately NOT run through the generic mock
 * analyzer (lib/ai/mock-analyzer.ts). That analyzer's output varies with
 * whatever transcript text happens to be recorded during a given take, which
 * would make the results screen different every recording. This fixed
 * result (see the DEMO_FLIGHT_ID branch in app/api/debrief/analyze/route.ts)
 * guarantees Scene 6 always shows the exact same specific, camera-ready
 * copy regardless of what actually gets said on mic. nextLessonFocus here is
 * what Scene 7 (/next-lesson) renders directly -- see
 * lib/training-memory.ts's computeNextLessonBrief.
 */
export const DEMO_CURATED_RESULT: StructuredDebrief = {
  flightSummary: "Traffic pattern work at Scottsdale, focused on stabilized approaches and landing technique.",
  whatWeDid: ["Traffic pattern work", "Normal landings", "Go-around practice"],
  wentWell: [
    "Better airspeed control in the pattern",
    "Consistent checklist usage",
    "Improved radio confidence",
  ],
  needsWork: [
    "Stabilize final approach earlier",
    "Reduce ballooning during flare",
    "Maintain centerline through rollout",
  ],
  instructorGuidance: [
    {
      instructorName: DEMO_INSTRUCTOR_NAME,
      quote: "Get on-speed by the time you turn final, not partway down it -- that's what's driving the flare timing.",
    },
  ],
  instructorAssistance: [],
  riskManagementNotes: [],
  assessmentDifferences: [],
  actionItems: [
    "Practice stabilized approaches to a consistent target speed",
    "Focus on a smoother, more consistent flare",
  ],
  nextLessonFocus: ["Stabilized approaches", "Sight picture during flare", "Centerline control"],
  studyReferences: [],
};
