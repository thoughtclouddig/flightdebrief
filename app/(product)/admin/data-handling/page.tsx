import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DATA_HANDLING_FACTS, DEFAULT_TRANSCRIPT_RETENTION_DAYS, effectiveRetentionDays } from "@/lib/consent";
import { getViewer } from "@/lib/viewer";
import { getRepository } from "@/lib/data";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The page a school owner is sent to when they ask "where does the audio
 * live, and what happens when a lawyer subpoenas it?"
 *
 * It exists because that question decides deals and had no written answer.
 * Everything here is a statement of fact about how the system actually
 * works -- if any of it stops being true, this page is wrong and must change
 * with the code, which is why the answers live in lib/consent.ts next to the
 * retention logic rather than in a CMS or a marketing page.
 *
 * The strongest fact is the first one, and it is architectural rather than a
 * policy promise: the recording is streamed to the transcription service
 * from the browser and never written here at all.
 */
export default async function DataHandlingPage() {
  // The (product)/admin layout already gates on role; this is belt-and-braces
  // for a page whose whole purpose is being trustworthy about access.
  const viewer = await getViewer();
  if (viewer.role !== "admin") notFound();

  const repo = getRepository();
  const org = await repo.getOrganization(viewer.organization.id);
  const retentionDays = effectiveRetentionDays(org?.transcriptRetentionDays);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Trust</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Recording, retention and deletion</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          What AfterFlight records, what it keeps, who can see it, and how to get rid of it. Written for the person who
          has to answer for it.
        </p>
      </div>

      <Card className="border-good/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-good" />
            AfterFlight does not store the recording
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground-soft">
          The microphone audio is streamed from the browser straight to the transcription service while the debrief is
          happening, and is discarded as it goes. No audio file is uploaded to AfterFlight, and there is no audio column
          in the database. There is no recording archive to export, produce, or subpoena &mdash; only the text.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your retention setting</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-foreground-soft">
          {retentionDays === null ? (
            <p>
              Transcripts for this school are kept <span className="font-semibold text-foreground">indefinitely</span>.
            </p>
          ) : (
            <p>
              Verbatim transcripts are cleared after{" "}
              <span className="font-semibold text-foreground">{retentionDays} days</span>
              {retentionDays === DEFAULT_TRANSCRIPT_RETENTION_DAYS ? " (the default)" : ""}. The structured training
              record &mdash; what was worked on, what went well, what carries forward &mdash; is kept, so a student
              never loses their history when the raw conversation ages out.
            </p>
          )}
          <p className="text-foreground-faint">
            To change this, or to delete a specific debrief now, contact support &mdash; per-debrief deletion is
            available today and a self-serve control is coming.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Straight answers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {DATA_HANDLING_FACTS.map((fact) => (
            <div key={fact.question}>
              <p className="text-sm font-semibold text-foreground">{fact.question}</p>
              <p className="mt-0.5 text-sm text-foreground-soft">{fact.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground-soft">
          Every debrief records consent from the participant starting it, before recording begins, stamped with the
          exact version of the consent text that was on screen. Consent can be withdrawn at any time; withdrawing it
          stops future recordings and is itself recorded, so the history of what was agreed and when stays intact.
        </CardContent>
      </Card>
    </div>
  );
}
