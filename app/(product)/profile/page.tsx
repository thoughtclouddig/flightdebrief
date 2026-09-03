import { BookOpen, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { LeaveOrganizationButton } from "@/components/leave-organization-button";
import { VoicePreferencePicker } from "@/components/voice-preference-picker";
import { QuietRow, Screen, Section } from "@/components/prototype/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const NOTICE_MESSAGES: Record<string, string> = {
  "email-updated": "Your email has been updated.",
  "email-change-expired": "That confirmation link is invalid or has expired.",
  "email-change-taken": "That email was claimed by another account before you confirmed.",
  "email-change-failed": "Something went wrong confirming your new email. Try again.",
};

/**
 * Account, help and the things a student needs once a month --
 * app/prototype/vector/profile/page.tsx is the design source, and its own
 * reasoning for dropping the three stat tiles (tracked hours/flight count/
 * skills-still-open) applies directly here: those numbers already live on
 * My Flights and Progress, which are one tap away, so repeating them here
 * would just be a second, staler copy. Not shared with CFI/admin --
 * components/nav.tsx's accountHrefForRole sends them to /cfi/profile and
 * /admin/settings respectively -- so this is a direct in-place rewrite.
 */
export default async function ProfilePage(props: PageProps<"/profile">) {
  const searchParams = await props.searchParams;
  const notice =
    (typeof searchParams.error === "string" && NOTICE_MESSAGES[searchParams.error]) ||
    (searchParams["email-updated"] ? NOTICE_MESSAGES["email-updated"] : null);
  const noticeIsError = typeof searchParams.error === "string";

  const repo = getRepository();
  const viewer = await getViewer();
  const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);

  const [links, flights, memberships] = await Promise.all([
    repo.listInstructorLinksForStudent(viewer.user.id),
    repo.listFlights({ studentId: viewer.user.id }),
    repo.listMembershipsForUser(viewer.user.id),
  ]);
  const activeLinks = links.filter((l) => l.status === "active");
  const instructors = (await Promise.all(activeLinks.map((l) => repo.getInstructor(l.instructorId)))).filter(
    (i) => i !== null,
  );
  const certificateType = memberships.find((m) => m.organizationId === viewer.organization.id)?.certificateType ?? null;
  const debriefedCount = flights.filter((f) => f.debriefStatus === "complete").length;
  const canLeaveOrg = viewer.organization.kind !== "individual" && !viewer.organization.demoExpiresAt;

  return (
    <Screen>
      {notice ? (
        <p
          className={
            noticeIsError
              ? "rounded-xl border border-danger/40 px-4 py-2.5 text-[15px] text-danger"
              : "rounded-xl border border-hairline bg-surface-sunken px-4 py-2.5 text-[15px] text-foreground"
          }
        >
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 px-1.5">
        <AvatarUpload name={viewer.user.name} avatarUrl={viewer.user.avatarUrl} />
        <div className="min-w-0">
          {certificateType ? <p className="text-[15px] text-foreground-faint">{certificateType}</p> : null}
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{viewer.user.name}</h1>
          <p className="mt-1 text-[15px] text-foreground-soft">{viewer.user.email}</p>
        </div>
        <ChangeEmailForm />
      </div>

      <Section title="Training">
        <div className="flex flex-col">
          <QuietRow href="/dashboard" label="My flights" meta={flights.length} />
          <QuietRow href="/debrief" label="My debriefs" meta={debriefedCount} />
          {/* Not QuietRow -- there's no instructor-detail or org-detail page
              to navigate to, and a chevron promising one would be a dead
              end. */}
          <InfoRow
            label={instructors.length === 1 ? "Instructor" : "Instructors"}
            value={instructors.length > 0 ? instructors.map((i) => i!.name).join(", ") : "None yet"}
          />
          <InfoRow label="Organization" value={viewer.organization.name} />
          {canLeaveOrg ? (
            <div className="flex min-h-[56px] w-full items-center border-b border-hairline last:border-b-0">
              <LeaveOrganizationButton organizationName={viewer.organization.name} />
            </div>
          ) : null}
        </div>
      </Section>

      {ttsEnabled ? (
        <Section title="Listen voice">
          <p className="mb-3 text-[15px] leading-relaxed text-foreground-soft">
            Used whenever you tap Listen on a brief or debrief.
          </p>
          <VoicePreferencePicker />
        </Section>
      ) : null}

      <Section title="Help">
        <div className="flex flex-col">
          <QuietRow
            href="/how-it-works"
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works
              </span>
            }
          />
          <QuietRow
            href="mailto:support@getafterflight.com"
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

      <a
        href="/api/auth/logout"
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-hairline text-[17px] font-medium text-foreground-soft"
      >
        <LogOut className="size-[18px]" aria-hidden />
        Sign out
      </a>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-hairline text-left last:border-b-0">
      <span className="text-[17px] text-foreground">{label}</span>
      <span className="shrink-0 text-[15px] text-foreground-faint">{value}</span>
    </div>
  );
}
