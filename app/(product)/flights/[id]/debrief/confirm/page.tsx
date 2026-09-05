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
 * Only reachable for a student whose own assessment isn't submitted yet
 * (the resolver at ../page.tsx redirects here instead of straight to
 * self-assessment); once they tap "Start debrief" they land on the real
 * rating form, same as before. See components/student/debrief/
 * objectives-screen.tsx for the shared presentation -- real flight, real
 * flight_tasks, real instructor here, no fixture data.
 *
 * Milestone 2A: when no flight_tasks exist yet, this is no longer a dead
 * end behind a CFI -- the student confirms the scope themselves via
 * ObjectiveConfirmationForm, then lands back on this same URL to see the
 * normal review-and-start screen below with their own picks populated.
 */
export default async function ConfirmDebriefPage(props: PageProps<"/flights/[id]/debrief/confirm">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { viewer, flight } = authorized;
  if (viewer.user.id !== flight.userId) notFound();
  if (flight.debriefStatus === "complete") redirect(`/flights/${id}/debrief/results`);

  const repo = getRepository();
  const tasks = await repo.listFlightTasks(id);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  if (tasks.length === 0) {
    return (
      <Screen>
        <BackLink href="/debrief">Debriefs</BackLink>
        <ObjectiveConfirmationForm
          flightId={id}
          allSkills={allTrainingSkills()}
          route={`${flight.departureAirport} → ${flight.arrivalAirport}`}
          durationLabel={`${formatHours(flight.durationMinutes)} hr`}
          dateLabel={dateLabel}
          aircraftType={flight.aircraft.type}
          tailNumber={flight.aircraft.tailNumber}
          redirectTo={`/flights/${id}/debrief/confirm`}
        />
      </Screen>
    );
  }

  const lessonFocus = deriveLessonFocus(tasks);
  const cfi = resolveCfiFirstName(flight.instructor);

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>
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
        startHref={`/flights/${id}/debrief/self-assessment`}
      />
    </Screen>
  );
}
