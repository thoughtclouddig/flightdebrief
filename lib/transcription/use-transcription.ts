"use client";

import { useDeepgramTranscription } from "./use-deepgram-transcription";
import { useMockTranscription } from "./use-mock-transcription";
import type { UseTranscription } from "./types";

/**
 * Picks live Deepgram streaming when NEXT_PUBLIC_DEEPGRAM_API_KEY is set,
 * otherwise falls back to a canned-transcript mock -- same hook shape either
 * way, so the debrief screen doesn't need to know which mode it's in.
 */
export function useTranscription(mockScript?: string): UseTranscription {
  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  // Hooks must be called unconditionally; only one branch's result is used.
  const live = useDeepgramTranscription(apiKey ?? "");
  const mock = useMockTranscription(mockScript);
  return apiKey ? live : mock;
}
