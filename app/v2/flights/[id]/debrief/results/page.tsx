import { notFound, redirect } from "next/navigation";
import { StudentDebriefV2 } from "@/components/debrief/student-debrief-v2";
import { getRepository } from "@/lib/data";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";

/**
 * Real completed-debrief view under /v2 -- identical to the student branch
 * of app/(product)/flights/[id]/debrief/results/page.tsx, which already
 * renders exactly StudentDebriefV2 with no other markup around it (see that
 * file's own comment: "The student's own view of this route is the V2
 * design language"). Nothing to redesign here -- this route only needed
 * wiring, not new product design. The instructor/admin branch of that page
 * (Replay + full DebriefResultSections, old markup) is not reproduced here
 * at all: /v2 is Student-only, that branch is never reachable.
 */
export default async function V2DebriefResultsPage(props: PageProps<"/v2/flights/[id]/debrief/results">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Fresults&reason=no-session`);
  }
  if (!authorized) notFound();
  const { flight, viewer } = authorized;
  if (viewer.role !== "student") notFound();

  const repo = getRepository();
  const debrief = await repo.getDebriefByFlight(id);
  if (!debrief) notFound();

  if (!viewer.user.guideProgress?.replay) {
    void repo.markGuideStepViewed(viewer.user.id, "replay").catch(() => {});
  }

  const tasks = await repo.listFlightTasks(id);
  const memberships = await repo.listMembershipsForUser(flight.userId);
  const certificateType =
    memberships.find((m) => m.organizationId === flight.organizationId)?.certificateType ?? null;
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  return (
    <StudentDebriefV2
      flight={flight}
      result={debrief.structuredResult}
      tasks={tasks}
      instructorFirstName={resolveCfiFirstName(flight.instructor)}
      certificateType={certificateType}
      ttsEnabled={ttsEnabled}
      flightId={flight.id}
      audioDurationSeconds={debrief.audioDurationSeconds}
      // V2 DESTINATION NOT MODELED: Next-Lesson Brief. app/(product)/next-lesson/page.tsx
      // is a full, real screen (upcoming reservation, focus areas, study
      // references, listen-to-brief audio) with no /v2 mirror -- not a simple
      // href repoint, genuine unbuilt product surface. Disabled rather than
      // sent to canonical, per this milestone's routing rule.
      nextLessonHref={null}
    />
  );
}
