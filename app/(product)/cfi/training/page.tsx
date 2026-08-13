import Link from "next/link";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { formatDurationShort } from "@/lib/utils";

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

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-white/15 dark:text-slate-400">
          <History className="size-8 text-slate-300" />
          No debriefs yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ flight, student, debrief }) => (
            <Link key={flight.id} href={`/flights/${flight.id}/debrief/results`}>
              <Card className="transition-colors hover:border-brand/40">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{student?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(flight.flightDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      · {flight.aircraft.tailNumber} · {formatDurationShort(flight.durationMinutes)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(debrief?.structuredResult.whatWeDid ?? []).slice(0, 3).map((t, i) => (
                        <Badge key={i} variant="neutral">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
