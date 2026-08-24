import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Visitor-facing banner for the public "try it live" demo (see
 * app/api/demo/start/route.ts) -- distinct from DemoControlPanel, which is
 * internal-only scene-list tooling for recording the marketing video. This
 * one renders in real production whenever the signed-in org is a demo org.
 */
function formatTimeLeft(expiresAt: string): string {
  const minutesLeft = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60_000));
  const hoursLeft = Math.floor(minutesLeft / 60);
  const remainder = minutesLeft % 60;
  return hoursLeft > 0 ? `${hoursLeft}h ${remainder}m` : `${minutesLeft}m`;
}

export function LiveDemoBanner({ expiresAt, hint }: { expiresAt: string; hint?: string | null }) {
  const timeLeft = formatTimeLeft(expiresAt);

  return (
    <div className="flex flex-col items-center gap-1 bg-brand px-4 py-2 text-center text-white">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-4" />
          You&rsquo;re in a live demo &mdash; this data resets in {timeLeft}.
        </span>
        <Link href="/signup" className="font-semibold underline underline-offset-2 hover:no-underline">
          Sign up to start your own
        </Link>
      </div>
      {hint ? <p className="text-pretty text-xs text-white/85">{hint}</p> : null}
    </div>
  );
}
