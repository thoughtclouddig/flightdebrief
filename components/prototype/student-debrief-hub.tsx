import type { ReactNode } from "react";
import { Mic } from "lucide-react";
import { Panel, PanelButton, PanelEyebrow, PanelHeadline, PageTitle, QuietRow, Screen, Section } from "@/components/prototype/ui";

/**
 * The Debrief hub's real content, shared between
 * app/prototype/vector/debrief/page.tsx (fixture props) and
 * app/(product)/debrief/page.tsx (database-derived props) -- the same
 * component renders for both.
 */
export interface StudentDebriefRow {
  id: string;
  href: string;
  /** Prototype: an authored lesson title. Production: no such title exists for a flight, so it uses the route instead -- an honest difference in what data is available, not a rendering bug. */
  label: string;
  dateLabel: string;
  instructorLabel: string | null;
  /** The recording's length, e.g. "1:12". Null when a debrief has no recorded duration to show. */
  durationLabel: string | null;
}

export interface StudentDebriefHubProps {
  /** Href for the "Just landed?" panel's Start-new-debrief button. Null hides the panel -- there is nothing to capture. */
  justLandedHref: string | null;
  latest: StudentDebriefRow | null;
  history: StudentDebriefRow[];
  emptyMessage?: string;
}

export function StudentDebriefHub({ justLandedHref, latest, history, emptyMessage }: StudentDebriefHubProps) {
  return (
    <Screen>
      <PageTitle>Debriefs</PageTitle>

      {justLandedHref ? (
        <Panel>
          <PanelEyebrow icon={<Mic className="size-3.5" aria-hidden />}>Just landed?</PanelEyebrow>
          <PanelHeadline>Capture it while it&rsquo;s fresh</PanelHeadline>
          <p className="mt-3 text-[15px] leading-relaxed text-panel-foreground-soft">
            Hand your instructor the phone, or record the conversation together. About ninety seconds.
          </p>
          <div className="mt-5">
            <PanelButton href={justLandedHref}>Start new debrief</PanelButton>
          </div>
        </Panel>
      ) : null}

      {latest ? (
        <Section title="Latest">
          <div className="flex flex-col">
            <QuietRow href={latest.href} label={<RowLabel row={latest} />} meta={latest.durationLabel} />
          </div>
        </Section>
      ) : null}

      {history.length > 0 ? (
        <Section title="Earlier">
          <div className="flex flex-col">
            {history.map((d) => (
              <QuietRow key={d.id} href={d.href} label={<RowLabel row={d} />} meta={d.durationLabel} />
            ))}
          </div>
        </Section>
      ) : null}

      {!justLandedHref && !latest ? (
        <p className="px-1.5 text-[15px] text-foreground-faint">
          {emptyMessage ?? "No flights yet -- your debriefs will show up here."}
        </p>
      ) : null}
    </Screen>
  );
}

function RowLabel({ row }: { row: StudentDebriefRow }): ReactNode {
  return (
    <>
      <span className="block font-medium">{row.label}</span>
      <span className="block text-[15px] text-foreground-faint">
        {row.dateLabel}
        {row.instructorLabel ? ` · ${row.instructorLabel}` : ""}
      </span>
    </>
  );
}
