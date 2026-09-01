import type { Metadata } from "next";
import { BookOpen, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/prototype/avatar";
import { FLIGHTS, TRACKED_HOURS_DISCLAIMER, trackedHours } from "@/lib/prototype/flights";
import { InfoTip, QuietRow, Screen, Section } from "@/components/prototype/ui";
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
      <div className="flex flex-col gap-4 px-1.5">
        <Avatar size={76} editable />
        <div className="min-w-0">
          <p className="text-[15px] text-foreground-faint">{STUDENT.certificate}</p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            {STUDENT.fullName}
          </h1>
        </div>
      </div>

      <div className="flex gap-2.5">
        {/* "Hours logged" was a number with no source behind it, which breaks
            this product's own rule. Tracked hours is computed from confirmed
            flights and carries its qualification with it. */}
        <Stat value={trackedHours()} label="Tracked hours" info={TRACKED_HOURS_DISCLAIMER} />
        <Stat value={`${FLIGHTS.length}`} label="Flights" />
        <Stat value={`${open}`} label="Still open" />
      </div>

      <Section title={<>Training</>}>
        <div className="flex flex-col">
          <QuietRow href="/prototype/vector/flights" label="My flights" meta={`${FLIGHTS.length}`} />
          <QuietRow href="/prototype/vector/progress" label="My progress" meta={`${SKILL_SCORES.length} skills`} />
          <QuietRow href="/prototype/vector/debrief" label="My debriefs" meta="3" />
          <QuietRow href="/prototype/vector/profile" label="Instructor" meta={INSTRUCTOR.fullName} />
        </div>
      </Section>

      <Section title={<>Help</>}>
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

function Stat({ value, label, info }: { value: string; label: string; info?: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-hairline bg-surface px-4 py-4">
      <div className="flex items-start justify-between">
        <p className="text-[26px] font-semibold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
        {info ? <InfoTip label={label}>{info}</InfoTip> : null}
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-foreground-faint">{label}</p>
    </div>
  );
}
