import { notFound } from "next/navigation";
import { DebriefRecorder } from "@/components/debrief-recorder";
import { getRepository } from "@/lib/data";

export default async function DebriefPage(props: PageProps<"/flights/[id]/debrief">) {
  const { id } = await props.params;
  const repo = getRepository();
  const flight = await repo.getFlight(id);
  if (!flight) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Voice Debrief</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
          {flight.aircraft.tailNumber} · {flight.departureAirport} → {flight.arrivalAirport}
        </h1>
      </div>
      <DebriefRecorder flightId={flight.id} />
    </div>
  );
}
