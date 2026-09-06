import type { Metadata } from "next";
import { Plus, Radar } from "lucide-react";
import { PageTitle, Panel, PanelButton, PanelEyebrow, PanelHeadline, QuietRow, Screen } from "@/components/student/ui";
import { StudentHome } from "@/components/student/student-home";
import { buildFixtureHomeProps } from "@/lib/prototype-fixtures/home-fixture-adapter";
import { buildFixtureStudentHrefs } from "@/lib/prototype-fixtures/fixture-student-hrefs";
import { STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { FLIGHT_DEFAULTS } from "@/lib/prototype-fixtures/flights";

export const metadata: Metadata = { title: "Home — AfterFlight", robots: { index: false, follow: false } };

const HREFS = buildFixtureStudentHrefs("/demo/student");

/**
 * The public Student demo's Home -- the exact approved Mia fixture
 * experience app/v2/page.tsx's own fixture branch renders, same component
 * (StudentHome) and same adapter (buildFixtureHomeProps), hrefs built from
 * /demo/student instead of /v2. No real-data branch here at all -- this
 * tree never reads a session or the database.
 */
export default async function DemoStudentHome({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  if (state === "landed") return <JustLanded />;
  return <StudentHome {...buildFixtureHomeProps(state, HREFS)} />;
}

/* --------------------------------------------- STATE B: flew, not added yet */

/** Mirrors app/v2/page.tsx's own JustLanded exactly -- local, not shared, same as its /v2 counterpart. Fixture-only: no production counterpart exists. */
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
          <PanelButton href={HREFS.flightsNew}>
            <Plus className="size-[18px]" aria-hidden />
            Add flight
          </PanelButton>
        </div>
      </Panel>

      <div className="flex flex-col">
        <QuietRow href={HREFS.flights} label="My flights" meta="5" />
        <QuietRow href={HREFS.progress} label="See progress" meta="4 skills" />
      </div>
    </Screen>
  );
}
