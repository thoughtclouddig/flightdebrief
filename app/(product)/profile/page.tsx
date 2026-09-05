import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { LeaveOrganizationButton } from "@/components/leave-organization-button";
import { VoicePreferencePicker } from "@/components/voice-preference-picker";
import Link from "next/link";
import { ProfileScreen } from "@/components/student/profile/profile-screen";
import { Section } from "@/components/student/ui";
import { getRepository } from "@/lib/data";
import { getViewer } from "@/lib/viewer";
import { buildProductionProfileProps } from "@/lib/student/profile-production-adapter";
import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import { hasActiveSubscription } from "@/lib/billing-gate";

export const dynamic = "force-dynamic";

const NOTICE_MESSAGES: Record<string, string> = {
  "email-updated": "Your email has been updated.",
  "email-change-expired": "That confirmation link is invalid or has expired.",
  "email-change-taken": "That email was claimed by another account before you confirmed.",
  "email-change-failed": "Something went wrong confirming your new email. Try again.",
};

/**
 * Account, help and the things a student needs once a month -- wired to the
 * approved V2 presentation (components/student/profile/profile-screen.tsx)
 * via lib/student/profile-production-adapter.ts. Not shared with CFI/admin --
 * components/nav.tsx's accountHrefForRole sends them to /cfi/profile and
 * /admin/settings respectively -- so this is a direct in-place rewrite.
 *
 * Voice preference, leave-organization, and the free-usage/entitlement
 * notice are real, working capabilities ProfileScreen has no field for at
 * all (unlike instructorHref, these aren't missing destinations -- there's
 * no row in its fixed three-row Training section for any of them). Rather
 * than perform surgery on the shared component's layout for account-status
 * content, they're kept working in a separate "Account" section below it,
 * using the same shared Section primitive ProfileScreen itself renders
 * with. The free-usage notice used to live on Progress, sitting above the
 * approved Skills/ACS view -- moved here since account/billing status
 * belongs with the rest of account status, not inside the training-progress
 * screen; it links to /billing, the real full billing page, rather than
 * duplicating that page's own subscribe flow here.
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
  const canLeaveOrg = viewer.organization.kind !== "individual" && !viewer.organization.demoExpiresAt;

  const isSchoolOrg = viewer.organization.kind === "school";
  const [productionProps, billingScopedFlights] = await Promise.all([
    buildProductionProfileProps(repo, viewer),
    isSchoolOrg
      ? repo.listFlights({ organizationId: viewer.organization.id })
      : repo.listFlights({ studentId: viewer.user.id }),
  ]);
  const freeUsage = isSchoolOrg
    ? computeSchoolFreeDebriefs(billingScopedFlights)
    : computeStudentFreeFlights(billingScopedFlights);
  const showFreeUsage = viewer.organization.kind !== "independent_cfi" && !hasActiveSubscription(viewer.organization);

  return (
    <>
      <ProfileScreen
        {...productionProps}
        banner={
          notice ? (
            <p
              className={
                noticeIsError
                  ? "rounded-xl border border-danger/40 px-4 py-2.5 text-[15px] text-danger"
                  : "rounded-xl border border-hairline bg-surface-sunken px-4 py-2.5 text-[15px] text-foreground"
              }
            >
              {notice}
            </p>
          ) : null
        }
        avatarSlot={<AvatarUpload size={76} name={viewer.user.name} avatarUrl={viewer.user.avatarUrl} />}
        email={viewer.user.email}
        emailAction={<ChangeEmailForm />}
      />

      {canLeaveOrg || ttsEnabled || showFreeUsage ? (
        <div className="flex flex-col gap-7 bg-surface-sunken px-4 pb-10">
          <Section title="Account">
            <div className="flex flex-col gap-4">
              <div className="flex min-h-[24px] items-center justify-between gap-3">
                <span className="text-[17px] text-foreground">Organization</span>
                <span className="shrink-0 text-[15px] text-foreground-faint">{viewer.organization.name}</span>
              </div>
              {showFreeUsage ? (
                <Link href="/billing" className="flex min-h-[24px] items-center justify-between gap-3">
                  <span className="text-[17px] text-foreground">Billing</span>
                  <span className="shrink-0 text-[15px] text-foreground-faint">
                    {freeUsage.exhausted
                      ? `Used all ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"}`
                      : `${freeUsage.used} of ${freeUsage.cap} free ${isSchoolOrg ? "debriefs" : "flights"} used`}
                  </span>
                </Link>
              ) : null}
              {ttsEnabled ? (
                <div>
                  <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-foreground-faint">
                    Listen voice
                  </p>
                  <VoicePreferencePicker />
                </div>
              ) : null}
              {canLeaveOrg ? <LeaveOrganizationButton organizationName={viewer.organization.name} /> : null}
            </div>
          </Section>
        </div>
      ) : null}
    </>
  );
}
