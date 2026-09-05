import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { LeaveOrganizationButton } from "@/components/leave-organization-button";
import { VoicePreferencePicker } from "@/components/voice-preference-picker";
import { ProfileScreen } from "@/components/student/profile/profile-screen";
import { Section } from "@/components/student/ui";
import { FLIGHTS } from "@/lib/prototype-fixtures/flights";
import { INSTRUCTOR, STUDENT } from "@/lib/prototype-fixtures/vector-data";
import { v2RealDataMode } from "@/lib/env";
import { hasV2RealDataCookie } from "@/lib/auth/session";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { buildProductionProfileProps } from "@/lib/student/profile-production-adapter";
import { computeSchoolFreeDebriefs, computeStudentFreeFlights } from "@/lib/entitlements";
import { hasActiveSubscription } from "@/lib/billing-gate";

export const metadata: Metadata = { title: "Profile — AfterFlight", robots: { index: false, follow: false } };

/**
 * Milestone 1B fixture-parity Profile -- mechanically the same as
 * app/prototype/vector/profile/page.tsx, hrefs repointed at /v2/**.
 *
 * Development real-data milestone: same adapter and same supplemental
 * Account section (avatar upload, email change, voice preference,
 * leave-organization, billing status) as app/(product)/profile/page.tsx --
 * skipping any of these here would be a real regression relative to
 * canonical, not a smaller surface.
 */
export default async function V2ProfilePage() {
  if (v2RealDataMode(await hasV2RealDataCookie())) {
    let viewer;
    try {
      viewer = await getViewer();
    } catch {
      redirect("/login?from=%2Fv2%2Fprofile&reason=no-session");
    }
    const repo = getRepository();
    const isSchoolOrg = viewer.organization.kind === "school";
    const [productionProps, billingScopedFlights] = await Promise.all([
      buildProductionProfileProps(repo, viewer, {
        flightsHref: "/v2/flights",
        debriefsHref: "/v2/debrief",
        instructorHref: "/v2/profile",
        guideHref: "/v2/profile/guide",
        supportHref: "/v2/profile/support",
      }),
      isSchoolOrg
        ? repo.listFlights({ organizationId: viewer.organization.id })
        : repo.listFlights({ studentId: viewer.user.id }),
    ]);
    const freeUsage = isSchoolOrg
      ? computeSchoolFreeDebriefs(billingScopedFlights)
      : computeStudentFreeFlights(billingScopedFlights);
    const showFreeUsage = viewer.organization.kind !== "independent_cfi" && !hasActiveSubscription(viewer.organization);
    const ttsEnabled = Boolean(process.env.DEEPGRAM_API_KEY);
    const canLeaveOrg = viewer.organization.kind !== "individual" && !viewer.organization.demoExpiresAt;

    return (
      <>
        <ProfileScreen
          {...productionProps}
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

  return (
    <ProfileScreen
      certificate={STUDENT.certificate}
      fullName={STUDENT.fullName}
      flightsHref="/v2/flights"
      flightsCount={FLIGHTS.length}
      debriefsHref="/v2/debrief"
      debriefsCount="3"
      instructorHref="/v2/profile"
      instructorName={INSTRUCTOR.fullName}
      guideHref="/v2/profile/guide"
      supportHref="/v2/profile/support"
      dataHandlingHref="/data-handling"
    />
  );
}
