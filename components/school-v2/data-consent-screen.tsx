import Link from "next/link";
import { ShieldCheck } from "lucide-react";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * School V2's Data & Consent -- audited against actual backend behavior
 * before writing a word of it (see the SCHOOL-V2-2 report). Every claim
 * below is backed by real code:
 *
 * - "Audio is never stored" is architectural and verified: debriefs has no
 *   audio column, audio is streamed to the transcription provider and
 *   dropped, and the one "audio" API route in the app is outbound TTS
 *   synthesis of AI-written text, unrelated to what was recorded.
 * - "Kept" / "discarded" claims mirror lib/consent.ts's DATA_HANDLING_FACTS,
 *   which are themselves verified against the schema and repository code.
 *
 * ONE claim canonical /admin/data-handling makes is NOT repeated here:
 * DATA_HANDLING_FACTS' "a school administrator can delete it sooner, at any
 * time" is false as written -- purgeDebriefTranscript (transcript-only) and
 * purgeExpiredTranscripts (retention-window enforcement) both exist as
 * repository methods but have ZERO API route, UI, or scheduled job wired to
 * either one anywhere in the codebase. Nothing today lets an admin delete a
 * transcript on demand, and no transcript is being auto-purged on a timer.
 * This screen says so truthfully instead of repeating the claim -- see the
 * SCHOOL-V2-2 report for the full audit trail.
 *
 * Browser review tightened the customer-facing wording once more: dropped
 * "two things aren't built yet" (internal/backlog-sounding) in favor of
 * plain present-tense statements, and dropped "subpoena" from the audio
 * copy (a legal-sounding claim about discoverability this product makes no
 * assertion about) in favor of a direct implementation fact. "Contact
 * AfterFlight Support" is phrased as a question-routing statement, not a
 * promise Support can perform a deletion -- no operational path for that
 * exists today (see the audit above), so promising one would repeat the
 * same kind of overstatement this screen exists to avoid.
 */
export function SchoolV2DataConsentScreen({ retentionDays }: { retentionDays: number | null }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Data &amp; consent</h1>
      </header>

      <SectionCard title="Recording &amp; consent">
        <p className="text-[15px] text-foreground">
          Every debrief records consent from the participant starting it, before recording begins, stamped with the
          exact version of the consent text that was on screen. Consent can be withdrawn at any time; withdrawing it
          stops future recordings and is itself recorded, so the history of what was agreed and when stays intact.
        </p>
      </SectionCard>

      <SectionCard title="What AfterFlight keeps">
        <p className="text-[15px] text-foreground">
          The transcript of the debrief, and the structured training record built from it &mdash; what was worked on,
          what went well, what needs work, and what carries into the next lesson.
        </p>
      </SectionCard>

      <SectionCard title="What AfterFlight discards">
        <p className="text-[15px] text-foreground">
          AfterFlight does not store the original audio recording. Audio is streamed to the transcription service
          during the debrief and is not saved to AfterFlight&rsquo;s servers or database.
        </p>
      </SectionCard>

      <SectionCard title="Who can access training data">
        <p className="text-[15px] text-foreground">
          The student, the instructor on that flight, and staff at your school. Records are scoped to one organization
          and are not shared between schools.
        </p>
      </SectionCard>

      <SectionCard title="Data deletion">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">Transcript retention</p>
            <p className="text-[15px] text-foreground">
              {retentionDays === null
                ? "Your school's current retention setting keeps debrief transcripts indefinitely."
                : `Your school's current retention setting keeps debrief transcripts for ${retentionDays} days.`}{" "}
              Structured training records are retained separately, so the student&rsquo;s training history remains
              available.
            </p>
          </div>
          <div className="border-t border-hairline pt-4">
            <p className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-foreground-faint">Deletion requests</p>
            <p className="text-[15px] text-foreground">
              Self-service transcript deletion is not currently available. For questions about transcript deletion,
              contact AfterFlight Support.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Privacy &amp; terms">
        <div className="flex flex-col gap-2">
          <Link href="/data-handling" className="flex items-center gap-2 text-[14px] font-medium text-brand">
            <ShieldCheck className="size-4" aria-hidden />
            Your audio &amp; your data
          </Link>
          <Link href="/privacy" className="text-[14px] font-medium text-brand">
            Privacy policy
          </Link>
          <Link href="/terms" className="text-[14px] font-medium text-brand">
            Terms of service
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
