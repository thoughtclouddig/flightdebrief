import { BookOpen, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { QuietRow, Screen, Section } from "@/components/student/ui";
import type { CfiV2Profile } from "@/lib/cfi-v2/profile";

/**
 * CFI V2's Profile -- identity, light account context, help, legal. Not the
 * shared Student V2 ProfileScreen: that component's "Training" section (My
 * flights/My debriefs/Instructor) is entirely student-shaped and has no CFI
 * equivalent, so this is its own small component reusing the same V2
 * primitives (Screen/Section/QuietRow) and the same real, already-proven-
 * for-CFI account widgets canonical /cfi/profile already uses
 * (AvatarUpload, ChangeEmailForm, /api/auth/logout).
 *
 * Deliberately excludes: training metrics, voice preference (Student/Vector-
 * specific), billing (school/admin-owned, not shown on canonical CFI
 * profile either), and any leave-organization control (a real capability,
 * but a heavier action than this lightweight identity screen asks for).
 */
export function CfiV2ProfileScreen({ profile }: { profile: CfiV2Profile }) {
  return (
    <Screen>
      <div className="flex flex-col gap-4 px-1.5">
        <AvatarUpload size={76} name={profile.name} avatarUrl={profile.avatarUrl} />
        <div className="min-w-0">
          <p className="text-[15px] text-foreground-faint">Instructor</p>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">{profile.name}</h1>
          <p className="mt-1 text-[15px] text-foreground-soft">{profile.email}</p>
          <div className="mt-2">
            <ChangeEmailForm />
          </div>
        </div>
      </div>

      <Section title="Account">
        <div className="flex flex-col gap-3">
          <div className="flex min-h-[24px] items-center justify-between gap-3">
            <span className="text-[17px] text-foreground">Organization</span>
            <span className="shrink-0 text-[15px] text-foreground-faint">{profile.organizationName}</span>
          </div>
          <div className="flex min-h-[24px] items-center justify-between gap-3">
            <span className="text-[17px] text-foreground">Active students</span>
            <span className="shrink-0 text-[15px] text-foreground-faint">{profile.activeStudentCount}</span>
          </div>
        </div>
      </Section>

      <Section title="Help">
        <div className="flex flex-col">
          <QuietRow
            href="/cfi-v2/profile/guide"
            label={
              <span className="flex items-center gap-3">
                <BookOpen className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                How AfterFlight works for CFIs
              </span>
            }
          />
          <QuietRow
            href="/cfi-v2/profile/support"
            label={
              <span className="flex items-center gap-3">
                <LifeBuoy className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Support
              </span>
            }
          />
        </div>
      </Section>

      <Section title="Legal & privacy">
        <div className="flex flex-col">
          <QuietRow
            href="/data-handling"
            label={
              <span className="flex items-center gap-3">
                <ShieldCheck className="size-[18px] shrink-0 text-foreground-faint" aria-hidden />
                Your audio &amp; your data
              </span>
            }
          />
          <QuietRow href="/privacy" label="Privacy" />
          <QuietRow href="/terms" label="Terms" />
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
