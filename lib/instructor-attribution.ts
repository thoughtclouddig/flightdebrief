import type { Instructor } from "@/lib/types";

/**
 * Instructor.name is free text typed at flight-creation time (could be
 * "Danny", "Danny Franks", "Mr. Franks") -- never guaranteed to already be a
 * bare first name. Returns null (never a guess/placeholder) when there's no
 * instructor or an empty name.
 *
 * That null is ambiguous on its own -- "no instructor at all" and
 * "instructor with an unresolvable name" both produce it, and treating both
 * the same way (reaching for a generic "your instructor" fallback
 * regardless) is exactly what put "Aug 30 · your instructor" on a genuinely
 * Solo flight's completed-debrief screen and "Based on your debrief with
 * your instructor" on that same student's Next Flight brief. Callers that
 * need to know whether copy may mention an instructor at all should use
 * instructorAttributionLabel() below instead, which takes the raw
 * instructor record and resolves that distinction correctly.
 */
export function resolveCfiFirstName(instructor: Instructor | null): string | null {
  const first = instructor?.name.trim().split(/\s+/)[0];
  return first || null;
}

/**
 * The one place "does this copy get to mention an instructor at all" gets
 * decided. Takes the raw instructor record, not the already-resolved name --
 * that's the only way to tell "no instructor" and "instructor with an
 * unresolvable name" apart. Returns null ONLY when there's genuinely no
 * instructor -- callers render solo-owned copy in that case, never a
 * sentence that implies one exists -- and a display name (the resolved
 * first name, or the generic "your instructor" label when an instructor
 * exists but couldn't be named) whenever one does.
 */
export function instructorAttributionLabel(instructor: Instructor | null): string | null {
  if (!instructor) return null;
  return resolveCfiFirstName(instructor) ?? "your instructor";
}
