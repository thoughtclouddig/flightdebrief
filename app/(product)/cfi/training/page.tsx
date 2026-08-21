import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { TrainingActivityList } from "@/components/training-activity-list";

export const dynamic = "force-dynamic";

export default async function CfiTrainingPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ instructorId: viewer.user.id });
  const debriefed = flights.filter((f) => f.debriefStatus === "complete");

  const rows = await Promise.all(
    debriefed.map(async (flight) => ({
      flight,
      student: await repo.getUser(flight.userId),
      debrief: await repo.getDebriefByFlight(flight.id),
    })),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Training activity</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent debriefs across your roster.</p>
      </div>

      <TrainingActivityList rows={rows} />
    </div>
  );
}
