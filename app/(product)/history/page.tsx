import { TrainingHistoryList } from "@/components/training-history-list";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  /** Certificated pilot flying without a CFI on the account -- see components/nav.tsx. */
  const solo = viewer.organization.kind === "individual";
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const debriefed = flights.filter((f) => f.debriefStatus === "complete");

  const withDebriefs = await Promise.all(
    debriefed.map(async (flight) => ({ flight, debrief: await repo.getDebriefByFlight(flight.id) })),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{solo ? "Skills history" : "Training history"}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your training memory -- nothing from a past lesson gets forgotten.
        </p>
      </div>

      <TrainingHistoryList rows={withDebriefs} />
    </div>
  );
}
