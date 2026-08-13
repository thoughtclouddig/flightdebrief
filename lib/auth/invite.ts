import { getRepository } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

/**
 * Shared by both invite-student and invite-cfi routes. Provisions a real
 * Supabase Auth account (so the person can actually sign in) and returns the
 * matching app-level `users` row, creating it if needed. Re-inviting an
 * email that already has a `users` row just returns that row as-is rather
 * than erroring.
 *
 * In mock mode (Supabase not configured) this falls back to the old
 * behavior -- a bare `users` row with no auth identity -- since there's
 * nothing to provision an account against.
 */
export async function inviteUser(input: { name: string; email: string; origin: string }): Promise<User> {
  const repo = getRepository();
  const email = input.email.trim();

  const existing = await repo.getUserByEmail(email);
  if (existing) return existing;

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return repo.createUser({ name: input.name, email });
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { name: input.name },
    redirectTo: `${input.origin}/invite/accept`,
  });
  if (error) throw error;

  return repo.createUser({ name: input.name, email, authUserId: data.user.id });
}
