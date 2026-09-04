import { BookOpen, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/prototype/avatar";
import { QuietRow, Screen, Section } from "@/components/student/ui";

/**
 * Account, help and the things a student needs once a month -- shared
 * between app/prototype/vector/profile/page.tsx and app/v2/profile/page.tsx.
 *
 * Reached from the avatar in the header rather than a fifth tab: the bottom
 * bar is for the four things they do every week, and adding a fifth would
 * have narrowed all of them to make room for the one nobody opens twice.
 */
export function ProfileScreen({
  certificate,
  fullName,
  flightsHref,
  flightsCount,
  debriefsHref,
  debriefsCount,
  instructorHref,
  instructorName,
  guideHref,
  supportHref,
  dataHandlingHref,
}: {
  certificate: string;
  fullName: string;
  flightsHref: string;
  flightsCount: number;
  debriefsHref: string;
  debriefsCount: string;
  instructorHref: string;
  instructorName: string;
  guideHref: string;
  supportHref: string;
  dataHandlingHref: string;
}) {
  return (
    <Screen>
      <div className="flex flex-col gap-4 px-1.5">
        <Avatar size={76} editable />
        <div className="min-w-0">
          <p className="text-[15px] text-foreground-faint">{certificate}</p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{fullName}</h1>
        </div>
      </div>

      <Section title={<>Training</>}>
        <div className="flex flex-col">
          <QuietRow href={flightsHref} label="My flights" meta={`${flightsCount}`} />
          <QuietRow href={debriefsHref} label="My debriefs" meta={debriefsCount} />
          <QuietRow href={instructorHref} label="Instructor" meta={instructorName} />
        </div>
      </Section>

      <Section title={<>Help</>}>
        <div className="flex flex-col">
          <QuietRow
            href={guideHref}
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works
              </span>
            }
          />
          <QuietRow
            href={supportHref}
            label={
              <span className="flex items-center gap-3">
                <LifeBuoy className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Support
              </span>
            }
          />
          <QuietRow
            href={dataHandlingHref}
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
