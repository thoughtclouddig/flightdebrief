"use client";

import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export const SUPPORT_EMAIL = "support@getafterflight.com";

/**
 * "Get help" in the product nav. Until this existed every support link lived
 * on marketing pages, so a signed-in user whose debrief wouldn't analyze had
 * nowhere to go -- the error said "try again" and stopped.
 *
 * The prefilled context is the whole point. Without it a ticket opens with
 * several round-trips establishing which account, which org, and which
 * screen; with it most are answerable on first read. Kept to identifying
 * details the recipient can act on -- nothing is sent anywhere until the
 * person presses send in their own mail client, and they can edit or delete
 * any of it first.
 */
export function SupportLink({
  name,
  email,
  organizationName,
  role,
  compact = false,
}: {
  name: string;
  email: string;
  organizationName: string;
  role: string;
  compact?: boolean;
}) {
  const pathname = usePathname();

  const body = [
    "",
    "",
    "---",
    "Sent from AfterFlight -- details below help us find your account:",
    `Name: ${name}`,
    `Email: ${email}`,
    `Organization: ${organizationName}`,
    `Role: ${role}`,
    `Page: ${pathname}`,
  ].join("\n");

  const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `AfterFlight help -- ${organizationName}`,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={href}
      aria-label="Get help"
      title="Get help"
      className={cn(
        "flex shrink-0 items-center justify-center transition-colors",
        compact
          ? "size-11 rounded-full text-foreground-faint hover:text-foreground"
          : "size-10 rounded-lg text-foreground-faint hover:bg-surface-sunken hover:text-foreground",
      )}
    >
      <LifeBuoy className={compact ? "size-[22px]" : "size-[18px]"} />
    </a>
  );
}
