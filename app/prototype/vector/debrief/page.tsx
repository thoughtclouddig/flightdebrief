import type { Metadata } from "next";
import { Mic } from "lucide-react";
import {
  Panel,
  PanelButton,
  PanelEyebrow,
  PanelHeadline,
  PageTitle,
  QuietRow,
  Screen,
  Section,
  SectionLabel,
} from "@/components/prototype/ui";
import { DEBRIEFS } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Debriefs — AfterFlight", robots: { index: false, follow: false } };

/**
 * The Debrief tab is a place to START a debrief, not only to read one.
 *
 * This is the ingestion engine for the whole product: Vector, progress and
 * next-flight prep all run on what gets captured here. Previously the tab
 * opened straight into the latest debrief, which meant the single most
 * important action in the app had no home at all -- you could only reach it
 * from a flight that happened to be in the right state.
 */
export default function DebriefHub() {
  const [latest, ...history] = DEBRIEFS;
  return (
    <Screen>
      <PageTitle>Debriefs</PageTitle>

      <Panel>
        <PanelEyebrow icon={<Mic className="size-3.5" aria-hidden />}>Just landed?</PanelEyebrow>
        <PanelHeadline>Capture it while it&rsquo;s fresh</PanelHeadline>
        <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
          Hand your instructor the phone, or record the conversation together. About ninety seconds.
        </p>
        <div className="mt-5">
          <PanelButton href="/prototype/vector/debrief/new">Start new debrief</PanelButton>
        </div>
      </Panel>

      <Section>
        <SectionLabel>Latest</SectionLabel>
        <div className="flex flex-col">
          <QuietRow
            href="/prototype/vector/debrief/latest"
            label={
              <>
                <span className="block font-medium">{latest!.lesson}</span>
                <span className="block text-[15px] text-foreground-faint">
                  {latest!.date} · {latest!.instructor}
                </span>
              </>
            }
            meta={latest!.length}
          />
        </div>
      </Section>

      <Section>
        <SectionLabel>Earlier</SectionLabel>
        <div className="flex flex-col">
          {history.map((d) => (
            <QuietRow
              key={d.id}
              href="/prototype/vector/debrief/latest"
              label={
                <>
                  <span className="block font-medium">{d.lesson}</span>
                  <span className="block text-[15px] text-foreground-faint">
                    {d.date} · {d.instructor}
                  </span>
                </>
              }
              meta={d.length}
            />
          ))}
        </div>
      </Section>
    </Screen>
  );
}
