import { redirect } from "next/navigation";

/**
 * Legacy Supabase invite-acceptance URL. With Replit Auth there's no
 * password to set -- invited users just log in with the Replit account that
 * matches their invited email. Old links land here, so keep the route and
 * send them to the login page.
 */
export default function InviteAcceptPage() {
  redirect("/login");
}
