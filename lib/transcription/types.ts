export type TranscriptionStatus = "idle" | "connecting" | "recording" | "stopped" | "error";

export interface TranscriptionState {
  status: TranscriptionStatus;
  mode: "live" | "mock";
  transcript: string;
  interimTranscript: string;
  amplitude: number;
  elapsedSeconds: number;
  error: string | null;
}

/** One recognized word with its offset (in seconds) from recording start -- used to build per-card transcript segments in Guided/Light mode. Freeform mode ignores this. */
export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  /** Deepgram diarization speaker index, when available. */
  speaker: number | null;
}

export interface FinishedTranscription {
  transcript: string;
  durationSeconds: number;
  /** Word-level timing for the whole session, in chronological order. Empty if the provider didn't supply it. */
  words: TranscriptWord[];
}

export interface UseTranscription extends TranscriptionState {
  start: () => Promise<void>;
  stop: () => FinishedTranscription;
}
