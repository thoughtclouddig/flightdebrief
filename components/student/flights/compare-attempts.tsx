import { Play } from "lucide-react";
import { AcsBadge, BackLink, Evidence, PageTitle, PrimaryButton, Screen, Section, SecondaryButton } from "@/components/student/ui";

export interface CompareRow {
  label: string;
  a: string;
  b: string;
}

/**
 * Compare attempts -- shared between
 * app/prototype/vector/flights/[id]/compare/page.tsx and
 * app/v2/flights/[id]/compare/page.tsx. The ground-track SVG geometry is
 * computed by the caller (pure math over fixture telemetry, no hrefs
 * involved) and passed in as ready-to-render path strings.
 *
 * The question is "what changed", never "which was better". A pass/fail frame
 * would put the product in the instructor's chair, and it would also be the
 * less useful answer -- a student already knows Approach 3 felt better. What
 * they cannot see from the cockpit is WHY, and two overlaid tracks with the
 * numbers underneath is the shortest route to it.
 */
export function CompareAttemptsScreen({
  backHref,
  kicker,
  aLabel,
  bLabel,
  pathA,
  pathB,
  rows,
  instructorEvidence,
  vectorText,
  trainHref,
  replayHrefA,
  replayHrefB,
  acsArea,
  acsCode,
}: {
  backHref: string;
  kicker: string;
  aLabel: string;
  bLabel: string;
  pathA: string;
  pathB: string;
  rows: CompareRow[];
  instructorEvidence: { who: string; quote: string } | null;
  vectorText: string;
  trainHref: string;
  replayHrefA: string;
  replayHrefB: string;
  acsArea: string;
  acsCode: string;
}) {
  return (
    <Screen>
      <BackLink href={backHref}>Flight analysis</BackLink>
      <PageTitle kicker={kicker}>
        {aLabel} vs {bLabel}
      </PageTitle>

      <Section title={<>Ground track</>} flush>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
          <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={`${aLabel} and ${bLabel} overlaid`}>
            <path d={pathA} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-state-attention-fill" />
            <path d={pathB} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-state-good" />
          </svg>
        </div>
        <div className="flex gap-5 px-1.5 pt-3">
          <span className="flex items-center gap-2 text-[15px] text-foreground">
            <span className="h-1 w-5 rounded-full bg-state-attention-fill" aria-hidden />
            {aLabel}
          </span>
          <span className="flex items-center gap-2 text-[15px] text-foreground">
            <span className="h-1 w-5 rounded-full bg-state-good" aria-hidden />
            {bLabel}
          </span>
        </div>
      </Section>

      {rows.length > 0 ? (
        <Section title={<>What changed</>}>
          <div className="flex flex-col">
            {rows.map((r) => (
              <div key={r.label} className="border-b border-hairline py-4 last:border-b-0">
                <p className="text-[15px] font-medium text-foreground-faint">{r.label}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  <p className="text-[17px] text-foreground">
                    <span className="font-medium">{aLabel}:</span> <span className="text-foreground-soft">{r.a}</span>
                  </p>
                  <p className="text-[17px] text-foreground">
                    <span className="font-medium">{bLabel}:</span> <span className="text-foreground-soft">{r.b}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="pt-3 text-[14px] leading-relaxed text-foreground-faint">
            Measured from the position and altitude record. Less variation is not automatically better &mdash; it&rsquo;s
            what your instructor was describing.
          </p>
        </Section>
      ) : null}

      {instructorEvidence ? (
        <Section title={<>{instructorEvidence.who} said</>} flush>
          <Evidence label={instructorEvidence.who} tone="instructor" text={instructorEvidence.quote} />
          <p className="px-1.5 pt-2 text-[14px] text-foreground-faint">From the debrief · linked to {bLabel}</p>
        </Section>
      ) : null}

      <Section title={<>Vector</>} flush>
        <Evidence label="Vector" tone="vector" quoted={false} text={vectorText} />
      </Section>

      <AcsBadge area={acsArea} code={acsCode} />

      <div className="flex flex-col gap-2.5">
        <PrimaryButton href={trainHref}>Train this with Vector</PrimaryButton>
        <div className="flex gap-2.5">
          <SecondaryButton href={replayHrefA}>
            <Play className="size-4 fill-current" aria-hidden />
            {aLabel}
          </SecondaryButton>
          <SecondaryButton href={replayHrefB}>
            <Play className="size-4 fill-current" aria-hidden />
            {bLabel}
          </SecondaryButton>
        </div>
      </div>
    </Screen>
  );
}
