import type { Metadata } from "next";
import { BookOpen, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/prototype/avatar";
import { FLIGHTS } from "@/lib/prototype/flights";
import { QuietRow, Screen, Section } from "@/components/prototype/ui";
import { INSTRUCTOR, STUDENT } from "@/lib/prototype/vector-data";

export const metadata: Metadata = { title: "Profile — AfterFlight", robots: { index: false, follow: false } };

/**
 * Account, help and the things a student needs once a month.
 *
 * Reached from the avatar in the header rather than a fifth tab: the bottom
 * bar is for the four things they do every week, and adding a fifth would
 * have narrowed all of them to make room for the one nobody opens twice.
 *
 * The three stat tiles that used to sit at the top are gone. Tracked hours
 * already leads My Flights, the flight count is the list itself, and "Still
 * open" counted skills below Meets Standard without ever saying so -- a number
 * whose meaning you had to reverse-engineer. Progress moved out of the
 * Training list for the same reason: it is a bottom-tab destination, and a
 * second door to it here only made the list longer.
 */
export default function ProfilePage() {
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

      <Section title={<>Training</>}>
        <div className="flex flex-col">
          <QuietRow href="/prototype/vector/flights" label="My flights" meta={`${FLIGHTS.length}`} />
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

