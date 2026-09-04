import { notFound, redirect } from "next/navigation";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { BackLink, Card, PageTitle, PrimaryButton, Screen, Section } from "@/components/student/ui";
import { deriveLessonFocus } from "@/lib/lesson-focus";
import { resolveCfiFirstName } from "@/lib/instructor-attribution";
import { formatFlightDate } from "@/lib/utils";
import { localIsoDate } from "@/lib/date";

function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * "Confirm this is the flight and these are the things we're about to
 * debrief" -- production's counterpart to app/prototype/vector/debrief/new's
 * Objectives() stage. Didn't exist in the real flow before: a student went
 * straight from the Debrief hub into the rating form with no read-only step
 * first. Real flight, real flight_tasks, real instructor -- no fixture data.
 *
 * Only reachable for a student whose own assessment isn't submitted yet
 * (the resolver at ../page.tsx redirects here instead of straight to
 * self-assessment); once they tap "Start debrief" they land on the real
 * rating form, same as before.
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
  // No objectives logged yet -- the resolver already handles this case for
  // the main /debrief URL; a direct hit here with nothing to confirm has
  // nothing useful to show either.
  if (tasks.length === 0) notFound();

  const lessonFocus = deriveLessonFocus(tasks);
  const cfi = resolveCfiFirstName(flight.instructor);
  const dateLabel = flight.flightDate === localIsoDate() ? "Today" : formatFlightDate(flight.flightDate);

  return (
    <Screen>
      <BackLink href="/debrief">Debriefs</BackLink>

      <PageTitle kicker="Today's lesson">{lessonFocus ?? `${flight.departureAirport} → ${flight.arrivalAirport}`}</PageTitle>

      <Card className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-medium text-foreground">
            {flight.departureAirport} &rarr; {flight.arrivalAirport} · {formatHours(flight.durationMinutes)} hr
          </span>
          <span className="mt-0.5 block text-[15px] text-foreground-faint">
            {dateLabel} · {flight.aircraft.type} · {flight.aircraft.tailNumber}
          </span>
        </span>
        <a href={`/flights/${id}/debrief/confirm/change`} className="shrink-0 text-[15px] font-medium text-brand">
          Change
        </a>
      </Card>

      <Section title="Today's objectives">
        <ul className="flex flex-col gap-3">
          {tasks.map((t, i) => (
            <li key={t.id} className="flex items-baseline gap-3 text-[17px] leading-snug text-foreground">
              <span className="text-[13px] font-semibold tabular-nums text-foreground-faint">{i + 1}</span>
              {t.label}
            </li>
          ))}
        </ul>
      </Section>

      <p className="text-[15px] leading-relaxed text-foreground-soft">
        {cfi
          ? `You'll rate each one first, then hand the phone to ${cfi}. Your answers stay hidden until you've both finished.`
          : "You'll rate each one first, then hand the phone to your instructor. Your answers stay hidden until you've both finished."}
      </p>

      <PrimaryButton href={`/flights/${id}/debrief/self-assessment`}>Start debrief</PrimaryButton>
    </Screen>
  );
}
