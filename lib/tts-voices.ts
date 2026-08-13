/**
 * Deepgram Flux TTS voices, set once in Profile (see components/voice-preference-picker.tsx)
 * and read wherever a Listen button plays audio (components/listen-button.tsx). Confirmed
 * against the actual outgoing request in Deepgram's own playground
 * (https://playground.deepgram.com/text-to-speech), not guessed from docs --
 * Flux's voice names/slugs weren't in the public model-list docs at the time
 * this was written.
 */
export interface TtsVoice {
  id: string;
  name: string;
  description: string;
}

export const TTS_VOICES: TtsVoice[] = [
  { id: "flux-hannah-en", name: "Hannah", description: "American, feminine" },
  // Kit's slug follows the confirmed flux-{name}-en pattern but wasn't itself
  // captured from a live request the way the other three were -- worth
  // double-checking against the playground's Network tab if it 404s.
  { id: "flux-kit-en", name: "Kit", description: "British, masculine" },
  { id: "flux-alexis-en", name: "Alexis", description: "American, feminine" },
  { id: "flux-cole-en", name: "Cole", description: "American, masculine" },
];

export const DEFAULT_TTS_VOICE = "flux-cole-en";

export function isValidTtsVoice(id: string): boolean {
  return TTS_VOICES.some((v) => v.id === id);
}

const STORAGE_KEY = "flightbrief-tts-voice";

export function readStoredVoice(): string {
  if (typeof window === "undefined") return DEFAULT_TTS_VOICE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidTtsVoice(stored) ? stored : DEFAULT_TTS_VOICE;
}

export function setStoredVoice(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}
