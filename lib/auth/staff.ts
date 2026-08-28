import { getSession } from "@/lib/auth/session";
import * as store from "@/lib/auth/store";
import { isSuperadmin } from "@/lib/superadmin";
import type { User } from "@/lib/types";

/**
 * Who's signed in, for AfterFlight's own console.
 *
 * Separate from getViewer() because that one requires an active organization
 * membership and returns an org and a role -- the right contract for every
 * product screen, and the wrong one here. AfterFlight staff aren't a member
 * of a customer's flight school, and shouldn't have to be: before this,
 * reaching /super-admin meant first creating an org for yourself and then
 * living in a student's navigation.
 *
 * Returns null rather than throwing, so callers can 404 rather than crash.
 */
export interface StaffViewer {
  user: User;
}

export async function getStaffViewer(): Promise<StaffViewer | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await store.getUserByAuthId(session.sub);
  if (!user) return null;
  if (!isSuperadmin(user.email)) return null;

  return { user };
}
