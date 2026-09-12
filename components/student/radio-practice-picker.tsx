"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BackLink, PageTitle, QuietRow, Screen, Section } from "@/components/student/ui";
import { RADIO_PRACTICE_SCENARIOS, RADIO_SCENARIO_PHASE_LABEL, type RadioScenarioPhase } from "@/lib/radio-practice-scenarios";

const PHASES = Object.keys(RADIO_SCENARIO_PHASE_LABEL) as RadioScenarioPhase[];

/**
 * Student-initiated Radio Practice -- reachable from Train regardless of org
 * kind, linked CFI, or an existing CFI assignment (see
 * app/api/radio-practice/assign/route.ts's own doc comment). The student
 * picks a scenario and starts it; the backend still records this as a
 * RadioPracticeAssignment with assignedBy: null, but that's an
 * implementation detail this screen never surfaces -- the student sees
 * "start practice," never "assign practice to myself."
 */
export function RadioPracticePicker({ backHref }: { backHref: string }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(scenarioId: string) {
    setStarting(scenarioId);
    setError(null);
    try {
      const res = await fetch("/api/radio-practice/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Couldn't start practice.");
      router.push(`/practice/${data.assignment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start practice.");
      setStarting(null);
    }
  }

  return (
    <Screen>
      <BackLink href={backHref}>Train</BackLink>
      <PageTitle kicker="Practice with Vector">Radio Practice</PageTitle>
      <p className="px-1.5 text-[15px] leading-relaxed text-foreground-soft">
        Pick a scenario -- you&rsquo;ll hear a real ATC call, respond out loud, and get feedback on what you said.
      </p>
      {error ? <p className="px-1.5 text-[14px] text-danger">{error}</p> : null}
      {PHASES.map((phase) => (
        <Section key={phase} title={RADIO_SCENARIO_PHASE_LABEL[phase]}>
          <div className="flex flex-col">
            {RADIO_PRACTICE_SCENARIOS.filter((s) => s.phase === phase).map((s) => (
              <QuietRow
                key={s.id}
                onClick={() => start(s.id)}
                label={s.title}
                meta={starting === s.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined}
                disabled={starting !== null && starting !== s.id}
              />
            ))}
          </div>
        </Section>
      ))}
    </Screen>
  );
}
