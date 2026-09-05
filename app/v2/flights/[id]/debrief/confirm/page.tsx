import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, Screen } from "@/components/student/ui";
import { ObjectivesScreen } from "@/components/student/debrief/objectives-screen";
import { ObjectiveConfirmationForm } from "@/components/student/debrief/objective-confirmation-form";
import { allTrainingSkills } from "@/lib/topics";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * Real objective confirmation under /v2 -- identical logic to
 * app/(product)/flights/[id]/debrief/confirm/page.tsx (same
 * ObjectivesScreen/ObjectiveConfirmationForm, same real flight_tasks), hrefs
 * repointed at /v2/**. "Change objectives" still points at the canonical
 * /flights/[id]/debrief/confirm/change -- not part of this milestone's
 * named vertical slice; a disclosed, temporary cross-tree link, not a
 * fixture leak (that screen is real, just not yet mirrored under /v2).
 */
export default async function V2ConfirmDebriefPage(props: PageProps<"/v2/flights/[id]/debrief/confirm">) {
  const { id } = await props.params;
  let authorized;
  try {
    authorized = await getAuthorizedFlight(id);
  } catch {
    redirect(`/login?from=%2Fv2%2Fflights%2F${id}%2Fdebrief%2Fconfirm&reason=no-session`);
  }
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.role !== "student" || viewer.user.id !== flight.userId) notFound();
  if (flight.debriefStatus === "complete") redirect(`/v2/flights/${id}/debrief/results`);

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  if (tasks.length === 0) {
    return (
      <Screen>
        <BackLink href="/v2/debrief">Debriefs</BackLink>
        <ObjectiveConfirmationForm
          flightId={id}
          allSkills={allTrainingSkills()}
          route={`${flight.departureAirport} → ${flight.arrivalAirport}`}
          durationLabel={`${formatHours(flight.durationMinutes)} hr`}
          dateLabel={dateLabel}
          aircraftType={flight.aircraft.type}
          tailNumber={flight.aircraft.tailNumber}
          redirectTo={`/v2/flights/${id}/debrief/confirm`}
        />
      </Screen>
    );
  }

  const lessonFocus = deriveLessonFocus(tasks);
  const cfi = resolveCfiFirstName(flight.instructor);

  return (
    <Screen>
      <BackLink href="/v2/debrief">Debriefs</BackLink>
      <ObjectivesScreen
        lessonTitle={lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`}
        route={`${flight.departureAirport} → ${flight.arrivalAirport}`}
        durationLabel={`${formatHours(flight.durationMinutes)} hr`}
        dateLabel={dateLabel}
        aircraftType={flight.aircraft.type}
        tailNumber={flight.aircraft.tailNumber}
        objectives={tasks.map((t) => t.label)}
        instructorFirstName={cfi}
        changeHref={`/flights/${id}/debrief/confirm/change`}
        startHref={`/v2/flights/${id}/debrief/self-assessment`}
      />
    </Screen>
  );
}
