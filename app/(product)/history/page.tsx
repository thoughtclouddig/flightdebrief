import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatDurationShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const repo = getRepository();
  const viewer = await getViewer();
  const flights = await repo.listFlights({ studentId: viewer.user.id });
  const debriefed = flights.filter((f) => f.debriefStatus === "complete");

  const withDebriefs = await Promise.all(
    debriefed.map(async (flight) => ({ flight, debrief: await repo.getDebriefByFlight(flight.id) })),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Training history</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your training memory -- nothing from a past lesson gets forgotten.
        </p>
      </div>

      {withDebriefs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          <History className="size-8 text-slate-300" />
          No debriefed flights yet.
        </div>
      ) : (
        <ol className="relative flex flex-col gap-8 border-l border-slate-200 pl-6 dark:border-white/10">
          {withDebriefs.map(({ flight, debrief }) => (
            <li key={flight.id} className="relative">
              <span className="absolute -left-[29px] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-brand dark:border-[#0a0e17]" />
              <Link href={`/flights/${flight.id}/debrief/results`} className="group">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-brand dark:text-white">
                  {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  <span className="ml-2 font-normal text-slate-400">
                    {flight.aircraft.tailNumber} · {formatDurationShort(flight.durationMinutes)}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(debrief?.structuredResult.whatWeDid ?? []).map((topic, i) => (
                    <Badge key={i} variant="neutral">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
