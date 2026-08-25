import type { Repository } from "@/lib/data/types";
import type { Viewer } from "@/lib/viewer";

export interface GuideStep {
  key: string;
  title: string;
  description: string;
  complete: boolean;
  /** Where the primary button/row tap goes -- null once there's nothing left to do (e.g. "Create your account"). */
  href: string | null;
  /** Button label shown only while incomplete; completed steps just show a check. */
  actionLabel: string | null;
}

export interface EducationTopic {
  key: string;
  title: string;
  body: string;
}

/**
 * The evergreen "Learn AfterFlight" section beneath the setup journey --
 * placeholder-depth on purpose per this feature's spec ("build the UI
 * architecture, use concise placeholder content"). Same shape for both
 * roles for now; role-specific copy is a natural follow-up once this needs
 * to grow into real contextual help.
 */
export const EDUCATION_TOPICS: EducationTopic[] = [
  {
    key: "great-debrief",
    title: "How a great debrief works",
    body: "Rate the flight separately first, then talk it through together -- what went well, what needs work, and what to carry into next time.",
  },
  {
    key: "debrief-replay",
    title: "Using Debrief Replay",
    body: "The short version of any debrief: what to keep doing, what to work on, a cue for the cockpit, and what to study before you fly again.",
  },
  {
    key: "next-flight",
    title: "Preparing for your next lesson",
    body: "Your next-lesson brief pulls forward what mattered from your last debrief, so you never start a lesson trying to remember where you left off.",
  },
  {
    key: "working-with-cfi",
    title: "Working with your CFI",
    body: "Everything you and your instructor cover after a flight stays attached to that flight -- visible to both of you, any time, even across instructors.",
  },
];

/** Student steps: Flight -> Debrief -> Replay -> Study -> Next Flight -> Progress. */
async function computeStudentGuideSteps(repo: Repository, viewer: Viewer): Promise<GuideStep[]> {
  const studentId = viewer.user.id;
  const [links, flights] = await Promise.all([
    repo.listInstructorLinksForStudent(studentId),
    repo.listFlights({ studentId }),
  ]);

  const connected = links.some((l) => l.status === "active");
  const completedFlights = flights.filter((f) => f.debriefStatus === "complete");
  const hasDebrief = completedFlights.length > 0;
  const pendingFlight = flights.find((f) => f.debriefStatus !== "complete") ?? null;
  const mostRecentCompleted =
    [...completedFlights].sort((a, b) => b.flightDate.localeCompare(a.flightDate))[0] ?? null;

  const progress = viewer.user.guideProgress ?? {};

  return [
    {
      key: "account",
      title: "Create your account",
      description: "You're in -- nothing else to do here.",
      complete: true,
      href: null,
      actionLabel: null,
    },
    {
      key: "cfi",
      title: "Connect with your CFI",
      description: "Your instructor links your account so your debriefs carry across lessons, even if you switch CFIs.",
      complete: connected,
      href: "/profile",
      actionLabel: connected ? null : "View Profile",
    },
    {
      key: "debrief",
      title: "Complete your first debrief",
      description: "Capture what went well, what needs work, and what comes next.",
      complete: hasDebrief,
      href: hasDebrief ? null : pendingFlight ? `/flights/${pendingFlight.id}/debrief` : "/flights/new",
      actionLabel: hasDebrief ? null : "Start Debrief",
    },
    {
      key: "replay",
      title: "Review your Debrief Replay",
      description: "Revisit the key takeaways, action items, and recommended study resources from your lesson.",
      complete: Boolean(progress.replay),
      href: mostRecentCompleted ? `/flights/${mostRecentCompleted.id}/debrief/results` : null,
      actionLabel: progress.replay ? null : "View Replay",
    },
    {
      key: "next-flight",
      title: "Prepare for your next flight",
      description: "Review what to practice before you get back in the airplane.",
      complete: Boolean(progress.nextFlight),
      href: "/next-lesson",
      actionLabel: progress.nextFlight ? null : "View Next Flight",
    },
    {
      key: "progress",
      title: "Track your training over time",
      description: "See recurring patterns, progress, and milestones across your training.",
      complete: Boolean(progress.progress) && completedFlights.length >= 2,
      href: "/progress",
      actionLabel: progress.progress ? null : "View Progress",
    },
  ];
}

async function computeInstructorGuideSteps(repo: Repository, viewer: Viewer): Promise<GuideStep[]> {
  const instructorId = viewer.user.id;
  const [roster, flights] = await Promise.all([
    repo.listStudentLinksForInstructor(instructorId, viewer.organization.id),
    repo.listFlights({ instructorId }),
  ]);

  const activeRoster = roster.filter((l) => l.status === "active");
  const hasStudent = activeRoster.length > 0;
  const hasDebrief = flights.some((f) => f.debriefStatus === "complete");
  const firstStudentId = activeRoster[0]?.studentId ?? null;

  const progress = viewer.user.guideProgress ?? {};

  return [
    {
      key: "student",
      title: "Connect with your first student",
      description: "Invite a student so their debriefs and training history show up under your roster.",
      complete: hasStudent,
      href: "/cfi/students",
      actionLabel: hasStudent ? null : "View Students",
    },
    {
      key: "debrief",
      title: "Complete your first debrief",
      description: "Walk a student through what went well, what needs work, and what's next.",
      complete: hasDebrief,
      href: "/cfi/today",
      actionLabel: hasDebrief ? null : "View Today",
    },
    {
      key: "replay",
      title: "Review a student's Debrief Replay",
      description: "See the same prioritized summary your student gets after a debrief.",
      complete: Boolean(progress.replay),
      href: "/cfi/flights",
      actionLabel: progress.replay ? null : "View Replay",
    },
    {
      key: "next-flight",
      title: "Prepare for a student's next lesson",
      description: "Pull forward what mattered from their last debrief before you fly together again.",
      complete: Boolean(progress.nextFlight),
      href: firstStudentId ? `/cfi/students/${firstStudentId}/handoff` : "/cfi/students",
      actionLabel: progress.nextFlight ? null : "View Next Flight",
    },
    {
      key: "progress",
      title: "Review student training history",
      description: "See recurring patterns and progress across a student's flights.",
      complete: Boolean(progress.progress),
      href: firstStudentId ? `/cfi/students/${firstStudentId}` : "/cfi/students",
      actionLabel: progress.progress ? null : "View Students",
    },
  ];
}

/** Admins don't get a Guide yet -- the spec only covers the student and CFI workflows; adding an admin variant would mean inventing steps that don't map to real functionality. */
export async function computeGuideSteps(repo: Repository, viewer: Viewer): Promise<GuideStep[]> {
  if (viewer.role === "student") return computeStudentGuideSteps(repo, viewer);
  if (viewer.role === "instructor") return computeInstructorGuideSteps(repo, viewer);
  return [];
}
