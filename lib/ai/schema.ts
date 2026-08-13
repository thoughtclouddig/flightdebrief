import { z } from "zod";

export const structuredDebriefSchema = z.object({
  whatWeDid: z.array(z.string()).default([]),
  wentWell: z.array(z.string()).default([]),
  needsWork: z.array(z.string()).default([]),
  instructorGuidance: z
    .array(
      z.object({
        instructorName: z.string(),
        quote: z.string(),
      }),
    )
    .default([]),
  actionItems: z.array(z.string()).default([]),
  nextLessonFocus: z.array(z.string()).default([]),
  studyReferences: z
    .array(
      z.object({
        topic: z.string(),
        source: z.string(),
        // Claude never populates this (see lib/ai/index.ts -- studyReferences are
        // always overwritten with the curated FAA-reference table afterward), so
        // accept its absence here and default to "" rather than failing validation.
        url: z
          .string()
          .optional()
          .transform((v) => v ?? ""),
      }),
    )
    .default([]),
});

export type StructuredDebriefResult = z.infer<typeof structuredDebriefSchema>;

export interface AnalyzeDebriefInput {
  transcript: string;
  flightMeta: {
    tailNumber: string;
    aircraftType: string;
    departureAirport: string;
    arrivalAirport: string;
    flightDate: string;
    durationMinutes: number;
    instructorName: string | null;
  };
  previousActionItems: string[];
}
