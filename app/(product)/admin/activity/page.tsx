import { Badge } from "@/components/ui/badge";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatDurationShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ organizationId: viewer.organization.id });

  const rows = await Promise.all(
    flights.map(async (flight) => ({
      flight,
      student: await repo.getUser(flight.userId),
      debrief: await repo.getDebriefByFlight(flight.id),
    })),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Training activity</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every flight across {viewer.organization.name}.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          No flights yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Student</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">CFI</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Aircraft</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Flight</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Debrief Status</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Next Focus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.map(({ flight, student, debrief }) => (
                <tr key={flight.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900 dark:text-white">{student?.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">{flight.instructor?.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">{flight.aircraft.tailNumber}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                    {formatDurationShort(flight.durationMinutes)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Badge variant={flight.debriefStatus === "complete" ? "success" : "warning"}>
                      {flight.debriefStatus === "complete" ? "Complete" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    {debrief?.structuredResult.nextLessonFocus.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
