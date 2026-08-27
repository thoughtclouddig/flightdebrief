import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, User } from "lucide-react";
import { FlightMap } from "@/components/flight-map";
import { DeleteFlightButton } from "@/components/delete-flight-button";
import { ResumeDebriefButton } from "@/components/resume-debrief-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthorizedFlight } from "@/lib/auth/access";
import { getRepository } from "@/lib/data";
import { simplifyTrackForDisplay } from "@/lib/flight-track";
import { formatDuration } from "@/lib/utils";

export default async function FlightDetailPage(props: PageProps<"/flights/[id]">) {
  const { id } = await props.params;
  const authorized = await getAuthorizedFlight(id);
  if (!authorized) notFound();
  const { flight, viewer } = authorized;

  const repo = getRepository();
  const isInstructorViewer = viewer.role === "instructor" || viewer.role === "admin";

  // Guided/light modes require the CFI to pick this flight's tasks before
  // anyone can start the debrief -- see app/(product)/flights/[id]/debrief/page.tsx.
  // Reflect that here instead of showing a live-looking button that immediately
  // bounces the student to a "not quite yet" screen.
  let tasksPending = false;
  let hasPendingDebrief = false;
  let guidanceMode: "freeform" | "guided" | "light" = "freeform";
  if (flight.debriefStatus !== "complete") {
    const org = flight.organizationId ? await repo.getOrganization(flight.organizationId) : null;
    guidanceMode = org?.defaultGuidanceMode ?? "freeform";
    if (guidanceMode !== "freeform") {
      const tasks = await repo.listFlightTasks(flight.id);
      tasksPending = tasks.length === 0;
    }
    // A recording saved while billing-blocked (see app/api/debrief/analyze/route.ts) --
    // offer to finish analyzing it instead of a fresh "Start Debrief" prompt.
    hasPendingDebrief = (await repo.getPendingDebriefTranscript(flight.id)) !== null;
  }

  const dateLabel = new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const displayTrack = simplifyTrackForDisplay(flight.track);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Training Flight</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
          {flight.aircraft.tailNumber}
        </h1>
        <p className="mt-1 text-xl text-slate-600 dark:text-slate-300">
          {flight.departureAirport} → {flight.arrivalAirport}
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoItem icon={CalendarDays} label="Date" value={dateLabel} />
          <InfoItem icon={Clock} label="Duration" value={formatDuration(flight.durationMinutes)} />
          <InfoItem icon={User} label="Instructor" value={flight.instructor?.name ?? "Not entered"} />
        </CardContent>
      </Card>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Flight track</h2>
          <Badge variant="outline">ADS-B contextual data</Badge>
        </div>
        <FlightMap track={displayTrack} />
      </div>

      {hasPendingDebrief && flight.debriefStatus !== "complete" ? (
        <Card>
          <CardContent className="py-4 text-sm text-foreground-soft">
            You have a debrief recording ready to analyze -- pick up right where you left off, no need to
            re-record.
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {flight.debriefStatus === "complete" ? (
          <Link href={`/flights/${flight.id}/debrief/results`} className={buttonVariants({ size: "lg", className: "h-16 w-full text-lg font-semibold sm:flex-1" })}>
            View Debrief
          </Link>
        ) : hasPendingDebrief ? (
          <div className="w-full sm:flex-1">
            <ResumeDebriefButton flightId={flight.id} />
          </div>
        ) : tasksPending && isInstructorViewer ? (
          <Link href={`/flights/${flight.id}/debrief/tasks`} className={buttonVariants({ size: "lg", className: "h-16 w-full text-lg font-semibold sm:flex-1" })}>
            Pick Today&rsquo;s Tasks
          </Link>
        ) : tasksPending ? (
          <Button size="lg" className="h-16 w-full text-lg font-semibold sm:flex-1" disabled>
            Waiting on your CFI
          </Button>
        ) : (
          <Link href={`/flights/${flight.id}/debrief`} className={buttonVariants({ size: "lg", className: "h-16 w-full text-lg font-semibold sm:flex-1" })}>
            {/* Only a solo/freeform flight has the student recording their own
                debrief -- in guided/light mode the CFI is the one who presses
                record, so this label shouldn't read as an instruction to the
                student to start anything themselves. */}
            {!isInstructorViewer && guidanceMode !== "freeform" ? "Continue" : "Start Debrief"}
          </Link>
        )}
        <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Back to flights
        </Link>
      </div>

      {viewer.role === "admin" ? (
        <div className="border-t border-hairline pt-6">
          <DeleteFlightButton flightId={flight.id} />
        </div>
      ) : null}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-400">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
