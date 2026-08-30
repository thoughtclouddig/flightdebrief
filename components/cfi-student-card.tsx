import type * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface CfiStudentCardProps {
  studentName: string;
  /** ReactNode, not string -- callers pass <LocalDateTime> so the lesson time renders in the viewer's zone rather than the server's. */
  timeLabel: React.ReactNode;
  tailNumber: string;
  aircraftType: string;
  focusAreas: string[];
  openBriefHref: string;
  profileHref: string;
}

/** "Today's students" roster card -- shared by the real CFI dashboard and the marketing site's demo data. */
export function CfiStudentCard({
  studentName,
  timeLabel,
  tailNumber,
  aircraftType,
  focusAreas,
  openBriefHref,
  profileHref,
}: CfiStudentCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold text-foreground">{studentName}</p>
          <p className="text-sm text-foreground-soft">
            {timeLabel} · {tailNumber} · {aircraftType}
          </p>
        </div>

        {focusAreas.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Today&rsquo;s Focus</p>
            <ul className="mt-1 flex flex-col gap-1">
              {focusAreas.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground-soft">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* One button when both go to the same place.
            "Open Brief" was pointing at the student's profile for anyone with
            no flight to debrief -- the identical destination as the Profile
            button beside it. Two buttons, same label difference, same result:
            a control that lies about what it does. */}
        <div className="flex gap-2 pt-1">
          {openBriefHref !== profileHref ? (
            <Link href={openBriefHref} className={buttonVariants({ size: "sm", className: "flex-1" })}>
              Open Brief
            </Link>
          ) : null}
          <Link
            href={profileHref}
            className={buttonVariants({
              size: "sm",
              variant: openBriefHref !== profileHref ? "outline" : "default",
              className: openBriefHref !== profileHref ? undefined : "flex-1",
            })}
          >
            Profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
