import type { Instructor } from "@/lib/types";

/**
 * Instructor.name is free text typed at flight-creation time (could be
 * "Danny", "Danny Franks", "Mr. Franks") -- never guaranteed to already be a
 * bare first name. Returns null (never a guess/placeholder) when there's no
 * instructor or an empty name, so callers always have an explicit fallback
 * ("your instructor") to reach for.
 */
export function resolveCfiFirstName(instructor: Instructor | null): string | null {
  const first = instructor?.name.trim().split(/\s+/)[0];
  return first || null;
}
