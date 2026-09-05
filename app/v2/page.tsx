import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus, Radar } from "lucide-react";
import { PageTitle, Panel, PanelButton, PanelEyebrow, PanelHeadline, QuietRow, Screen } from "@/components/student/ui";
import { StudentHome } from "@/components/student/student-home";
import { isStaging } from "@/lib/env";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionHomeProps, type HomeHrefBuilders } from "@/lib/student/home-production-adapter";
import { buildFixtureHomeProps } from "@/lib/prototype-fixtures/home-fixture-adapter";
import { STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { FLIGHT_DEFAULTS } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 2A: Home only. Every other /v2 experience (Flights, Debrief,
 * Train, Progress) is still Milestone 1B fixture product, so every builder
 * here is null except addFlight -- see HomeHrefBuilders' own doc comment for
 * what that means to the adapter. Milestone 2B replaces these one at a time
 * as each experience gets a real /v2 route with real data behind it.
 */
const V2_PRODUCTION_HREFS: HomeHrefBuilders = {
  myFlights: null,
  pastDebriefs: null,
  debrief: null,
  flightDetail: null,
  train: null,
  addFlight: { href: "/v2/flights/new", disabled: true },
  debriefResults: null,
  progress: null,
};

/**
 * Milestone 1B fixture-parity Home -- mechanically the same as
 * app/prototype/vector/page.tsx, hrefs repointed at /v2/**. Every destination
 * this screen offers now exists under /v2 (Flights, Debrief lifecycle/Detail,
 * Fly), so nothing here is disabled anymore -- see Milestone 1A's version of
 * this file for the interim state.
 *
 * Milestone 2A: environment-driven adapter selection, per the approved
 * architecture -- development keeps this exact fixture rendering (the
 * approved Milestone 1B reference), staging uses real repository data via
 * buildProductionHomeProps. Production is moot; app/v2/layout.tsx already
 * 404s there before this ever renders.
 */
export default async function V2Home({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (isStaging()) {
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
