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

export interface FinishedTranscription {
  transcript: string;
  durationSeconds: number;
}

export interface UseTranscription extends TranscriptionState {
  start: () => Promise<void>;
  stop: () => FinishedTranscription;
}
