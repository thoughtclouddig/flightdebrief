import type { Metadata } from "next";
import { BookOpen, LifeBuoy, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { PageTitle, QuietRow, Screen, Section, SectionLabel } from "@/components/prototype/ui";
import { INSTRUCTOR, SKILL_SCORES, STUDENT } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Profile — AfterFlight", robots: { index: false, follow: false } };

/**
 * Account, help and the things a student needs once a month.
 *
 * Reached from the avatar in the header rather than a fifth tab: the bottom
 * bar is for the four things they do every week, and adding a fifth would
 * have narrowed all of them to make room for the one nobody opens twice.
 *
 * The training summary at the top exists so the screen is not purely a
 * settings list -- it answers "where am I" before it offers "what can I
 * change", which is the order a student actually cares about.
 */
export default function ProfilePage() {
  const open = SKILL_SCORES.filter((s) => s.state !== "Meets Standard").length;

  return (
    <Screen>
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[22px] font-semibold text-foreground-soft">
          <UserRound className="size-7" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="min-w-0">
          <PageTitle kicker={STUDENT.certificate}>{STUDENT.fullName}</PageTitle>
        </div>
      </div>

      <div className="flex gap-3">
        <Stat value={`${STUDENT.hours}`} label="Hours logged" />
        <Stat value={`${SKILL_SCORES.length}`} label="Skills tracked" />
        <Stat value={`${open}`} label="Still open" />
      </div>

      <Section>
        <SectionLabel>Training</SectionLabel>
        <div className="flex flex-col">
          <QuietRow href="/prototype/vector/progress" label="My progress" meta={`${SKILL_SCORES.length} skills`} />
          <QuietRow href="/prototype/vector/debrief" label="My debriefs" meta="3" />
          <QuietRow href="/prototype/vector/profile" label="Instructor" meta={INSTRUCTOR.fullName} />
        </div>
      </Section>

      <Section>
        <SectionLabel>Help</SectionLabel>
        <div className="flex flex-col">
          <QuietRow
            href="/prototype/vector/profile/guide"
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works
              </span>
            }
          />
          <QuietRow
            href="/prototype/vector/profile/support"
            label={
              <span className="flex items-center gap-3">
                <LifeBuoy className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Support
              </span>
            }
          />
          <QuietRow
            href="/data-handling"
            label={
              <span className="flex items-center gap-3">
                <ShieldCheck className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Your audio &amp; your data
              </span>
            }
          />
        </div>
      </Section>

      <button className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-hairline text-[17px] font-medium text-foreground-soft">
        <LogOut className="size-[18px]" aria-hidden />
        Sign out
      </button>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-surface-sunken px-4 py-4">
      <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">{label}</p>
    </div>
  );
}
