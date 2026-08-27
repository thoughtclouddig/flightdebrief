"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/waveform";
import { QuestionCardStack } from "@/components/debrief/question-card-stack";
import { SwipeableCard } from "@/components/debrief/swipeable-card";
import { CardControls } from "@/components/debrief/card-controls";
import { RecordingConsent } from "@/components/debrief/recording-consent";
import { useTranscription } from "@/lib/transcription";
import type { CardBoundary } from "@/lib/debrief-cards/segments";
import type { DebriefCard, DebriefGuidanceMode } from "@/lib/types";

type LocalCard = DebriefCard & { localStatus: "pending" | "completed" | "skipped" };

export function GuidedDebriefRecorder({
  flightId,
  initialCards,
  guidanceMode,
}: {
  flightId: string;
  initialCards: DebriefCard[];
  guidanceMode: DebriefGuidanceMode;
}) {
  const router = useRouter();
  const transcription = useTranscription();

  const [phase, setPhase] = useState<"consent" | "ready" | "recording" | "analyzing">("consent");
  const [cards, setCards] = useState<LocalCard[]>(initialCards.map((c) => ({ ...c, localStatus: "pending" })));
  const [activeIndex, setActiveIndex] = useState(0);
  const [boundaries, setBoundaries] = useState<CardBoundary[]>([]);
  const [addingTopic, setAddingTopic] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeCard = cards[activeIndex];

  function openBoundary(cardId: string) {
    setBoundaries((b) => [...b, { cardId, startSeconds: transcription.elapsedSeconds, endSeconds: null }]);
  }

  function closeBoundary() {
    setBoundaries((b) => {
      if (b.length === 0) return b;
      const last = b[b.length - 1];
      if (last.endSeconds !== null) return b;
      return [...b.slice(0, -1), { ...last, endSeconds: transcription.elapsedSeconds }];
    });
  }

  async function handleStart() {
    setPhase("recording");
    await transcription.start();
    if (cards[0]) openBoundary(cards[0].id);
  }

  function advanceTo(index: number, status: LocalCard["localStatus"]) {
    closeBoundary();
    const finishedCardId = activeCard.id;
    setCards((prev) => prev.map((c, i) => (i === activeIndex ? { ...c, localStatus: status } : c)));
    setActiveIndex(index);
    if (cards[index]) openBoundary(cards[index].id);
    // Best-effort -- the UI already reflects the new status locally either way.
    fetch(`/api/flights/${flightId}/debrief/cards/${finishedCardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  function handleBack() {
    if (activeIndex === 0) return;
    advanceTo(activeIndex - 1, "pending");
  }

  function handleSkip() {
    if (activeIndex >= cards.length - 1) return;
    advanceTo(activeIndex + 1, "skipped");
  }

  function handleNext() {
    if (activeIndex >= cards.length - 1) return;
    advanceTo(activeIndex + 1, "completed");
  }

  async function handleToggleFlag() {
    const nextFlag = !activeCard.flaggedForFollowUp;
    setCards((prev) => prev.map((c, i) => (i === activeIndex ? { ...c, flaggedForFollowUp: nextFlag } : c)));
    try {
      await fetch(`/api/flights/${flightId}/debrief/cards/${activeCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flaggedForFollowUp: nextFlag }),
      });
    } catch {
      // Best-effort -- the flag still reflects locally, and the CFI can retry via the card again.
    }
  }

  async function submitTopic() {
    if (!topicTitle.trim() || !topicPrompt.trim()) return;
    try {
      const res = await fetch(`/api/flights/${flightId}/debrief/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: topicTitle, primaryPrompt: topicPrompt }),
      });
      if (!res.ok) throw new Error();
      const { card } = (await res.json()) as { card: DebriefCard };
      setCards((prev) => {
        const next = [...prev];
        next.splice(activeIndex + 1, 0, { ...card, localStatus: "pending" });
        return next;
      });
      setTopicTitle("");
      setTopicPrompt("");
      setAddingTopic(false);
    } catch {
      setError("Couldn't add that topic -- check your connection and try again.");
    }
  }

  async function handleEnd() {
    closeBoundary();
    setPhase("analyzing");
    setError(null);
    const recordingStartedAt = new Date(Date.now() - transcription.elapsedSeconds * 1000).toISOString();
    const { transcript, durationSeconds, words } = transcription.stop();
    const recordingEndedAt = new Date().toISOString();

    try {
      const res = await fetch("/api/debrief/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightId,
          transcript,
          audioDurationSeconds: durationSeconds,
          guidanceMode,
          recordingStartedAt,
          recordingEndedAt,
          words,
          cardBoundaries: boundaries,
        }),
      });
      if (res.status === 402) {
        router.push("/billing");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || "Something went wrong analyzing your debrief. Please try again.");
      }
      router.push(`/flights/${flightId}/debrief/review`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Something went wrong analyzing your debrief. Please try again.");
      setPhase("recording");
    }
  }

  if (cards.length === 0) {
    return <p className="text-center text-sm text-foreground-soft">No debrief cards yet -- both assessments need to be submitted first.</p>;
  }

  if (phase === "consent") {
    return <RecordingConsent flightId={flightId} onGranted={() => setPhase("ready")} />;
  }

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <p className="max-w-sm text-foreground-soft">
          Talk through the flight naturally -- these cards are just here to guide what to cover.
          Recording runs continuously the whole time.
        </p>
        <button
          onClick={handleStart}
          className="flex size-24 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition-transform hover:scale-105 active:scale-95"
        >
          <Mic className="size-9" />
        </button>
        <p className="text-sm font-medium text-foreground">Start Debrief</p>
        {transcription.mode === "mock" ? (
          <p className="text-xs text-foreground-soft">Live mic transcription needs a Deepgram key -- this demo plays back a sample debrief.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-brand">
        <span className={phase === "recording" ? "size-2 animate-pulse rounded-full bg-danger" : "size-2 rounded-full bg-hairline"} />
        Recording
        <span className="tabular-nums text-foreground-soft">
          {Math.floor(transcription.elapsedSeconds / 60)}:{(transcription.elapsedSeconds % 60).toString().padStart(2, "0")}
        </span>
      </div>
      <Waveform amplitude={transcription.amplitude} active={phase === "recording"} />

      {phase === "recording" && transcription.lowAudioWarning ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-center text-sm font-medium text-danger">
          We are not picking up any sound -- check that the right microphone is selected.
        </p>
      ) : null}

      <SwipeableCard
        onSwipeLeft={handleNext}
        onSwipeRight={handleBack}
        canSwipeLeft={activeIndex < cards.length - 1}
        canSwipeRight={activeIndex > 0}
        disabled={phase === "analyzing"}
      >
        <QuestionCardStack card={activeCard} position={activeIndex + 1} total={cards.length} />
      </SwipeableCard>
      <p className="-mt-2 text-center text-xs text-foreground-faint sm:hidden">Swipe to move between cards</p>

      {addingTopic ? (
        <div className="flex flex-col gap-2 rounded-lg border border-hairline p-4">
          <input
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder="Topic title"
            className="min-h-11 rounded-lg border border-hairline bg-transparent px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <textarea
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            placeholder="What do you want to ask about?"
            rows={2}
            className="min-h-11 rounded-lg border border-hairline bg-transparent px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddingTopic(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submitTopic} className="flex-1">
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAddingTopic(true)}>
          <Plus className="size-4" /> Add Topic
        </Button>
      )}

      <CardControls
        canGoBack={activeIndex > 0}
        isLast={activeIndex >= cards.length - 1}
        flagged={activeCard.flaggedForFollowUp}
        onBack={handleBack}
        onSkip={handleSkip}
        onNext={handleNext}
        onToggleFlag={handleToggleFlag}
        onEnd={handleEnd}
        disabled={phase === "analyzing"}
      />

      {phase === "analyzing" ? (
        <p className="flex items-center justify-center gap-2 text-sm text-foreground-soft">
          <Loader2 className="size-4 animate-spin" /> Analyzing your debrief…
        </p>
      ) : null}

      {error ? <p className="text-center text-sm text-danger">{error}</p> : null}
    </div>
  );
}
