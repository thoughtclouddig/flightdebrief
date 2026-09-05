import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus, Radar } from "lucide-react";
import { PageTitle, Panel, PanelButton, PanelEyebrow, PanelHeadline, QuietRow, Screen } from "@/components/student/ui";
import { StudentHome } from "@/components/student/student-home";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionHomeProps, type HomeHrefBuilders } from "@/lib/student/home-production-adapter";
import { buildFixtureHomeProps } from "@/lib/prototype-fixtures/home-fixture-adapter";
import { STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { FLIGHT_DEFAULTS } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Development real-data milestone: every /v2 top-level screen now has a real
 * route behind it (Flights, Flight Detail, Train, Debrief hub, Progress),
 * so every builder below is real. Add Flight stays the one disabled
 * exception -- Milestone 2A's own reasoning still applies: no production web
 * save endpoint for live recording exists, and StudentHome's addFlightHref
 * truthiness controls the whole Start-Flight/Add-Flight row, so it stays a
 * real, non-empty, visibly-disabled href rather than null.
 */
const V2_PRODUCTION_HREFS: HomeHrefBuilders = {
  myFlights: "/v2/flights",
  pastDebriefs: "/v2/debrief",
  debrief: (flightId: string) => `/v2/flights/${flightId}/debrief`,
  flightDetail: (flightId: string) => `/v2/flights/${flightId}`,
  train: "/v2/train",
  addFlight: { href: "/v2/flights/new", disabled: true },
  debriefResults: (flightId: string) => `/v2/flights/${flightId}/debrief/results`,
  progress: "/v2/progress",
};

/**
 * Milestone 1B fixture-parity Home -- mechanically the same as
 * app/prototype/vector/page.tsx, hrefs repointed at /v2/**. Every destination
 * this screen offers now exists under /v2 (Flights, Debrief lifecycle/Detail,
 * Fly), so nothing here is disabled anymore -- see Milestone 1A's version of
 * this file for the interim state.
 *
 * Development real-data milestone: v2RealDataMode() is the one check now
 * (see its own doc comment in lib/env.ts) -- development renders this exact
 * fixture experience unless the real-data cookie is set (app/api/v2/
 * enter-real-data), staging renders it unless v2StagingUsesRealData() is
 * deliberately flipped (untouched by this milestone). Production is moot;
 * app/v2/layout.tsx already 404s there before this ever renders.
 */
export default async function V2Home({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2&reason=no-session");
    }
    const props = await buildProductionHomeProps(getRepository(), viewer, V2_PRODUCTION_HREFS);
    return <StudentHome {...props} />;
  }

  const { state } = await searchParams;
  if (state === "landed") return <JustLanded />;
  return <StudentHome {...buildFixtureHomeProps(state)} />;
}

/* --------------------------------------------- STATE B: flew, not added yet */

/** Mirrors app/prototype/vector/page.tsx's own JustLanded exactly -- local, not shared, same as its prototype counterpart. Fixture-only: no production counterpart exists (see this file's own module doc), so it is unreachable outside development. */
function JustLanded() {
  return (
    <Screen>
      <PageTitle kicker="Good afternoon">{STUDENT.firstName}</PageTitle>

      <Panel>
        <PanelEyebrow icon={<Radar className="size-3.5" aria-hidden />}>Flew today?</PanelEyebrow>
        <PanelHeadline>Add it while it&rsquo;s fresh</PanelHeadline>
        <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
          Give us the tail number and we&rsquo;ll pull up what {FLIGHT_DEFAULTS.recentAircraft[0]!.tailNumber} and
          your other aircraft flew today. You pick which one was yours.
        </p>
        <div className="mt-6">
          <PanelButton href="/v2/flights/new">
            <Plus className="size-[18px]" aria-hidden />
            Add flight
          </PanelButton>
        </div>
      </Panel>

      <div className="flex flex-col">
        <QuietRow href="/v2/flights" label="My flights" meta="5" />
        <QuietRow href="/v2/progress" label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}
