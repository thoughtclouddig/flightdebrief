import { Mail } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { ChangeEmailForm } from "@/components/change-email-form";
import { RenameOrganization } from "@/components/admin/rename-organization";
import { Badge } from "@/components/ui/badge";
import { organizationKindLabel } from "@/lib/types";
import type { OrganizationKind } from "@/lib/types";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground-faint">{title}</h2>
      <div className="rounded-2xl border border-hairline bg-surface px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * School V2's Settings -- reuses the exact same real, working capabilities
 * canonical /admin/settings does (RenameOrganization -> PATCH
 * /api/admin/organization, ChangeEmailForm -> POST /api/auth/change-email,
 * AvatarUpload -> PATCH /api/profile/avatar), just in School V2
 * presentation. Intentionally boring: no fake configuration controls, no
 * billing section -- billing is a real, working, role-gated capability, but
 * it lives at a separate top-level /billing route today (not nested under
 * canonical /admin/** either), so adding it here would be new scope, not a
 * reuse of an existing School V2-adjacent surface.
 */
export function SchoolV2SettingsScreen({
  name,
  email,
  avatarUrl,
  organizationName,
  organizationKind,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  organizationName: string;
  organizationKind: OrganizationKind;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-foreground">Settings</h1>
      </header>

      <SectionCard title="Organization">
        <p className="mb-1 text-[13px] text-foreground-faint">School name</p>
        <RenameOrganization name={organizationName} label={organizationKind === "school" ? "School" : "Organization"} />
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-1.5 text-[13px] text-foreground-faint">Workspace type</p>
          <Badge variant="neutral" className="capitalize">
            {organizationKindLabel(organizationKind)}
          </Badge>
        </div>
      </SectionCard>

      <SectionCard title="Account">
        <div className="flex items-center gap-3">
          <AvatarUpload name={name} avatarUrl={avatarUrl} emphasizeBadge />
          <p className="text-[17px] font-medium text-foreground">{name}</p>
        </div>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-2 text-[14px] text-foreground-soft">
            <Mail className="size-4 shrink-0 text-foreground-faint" aria-hidden />
            <span className="truncate">{email}</span>
          </p>
          <div className="shrink-0 whitespace-nowrap">
            <ChangeEmailForm returnContext="school-v2-settings" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
