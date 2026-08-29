/**
 * Waits for a drafting job started by the content pipeline.
 *
 * Shared by the draft and redraft buttons: both start the same kind of
 * multi-minute job, and both previously duplicated the polling loop.
 */
const POLL_MS = 4000;
/** ~8 minutes. Past that, stop rather than spin forever. */
const MAX_POLLS = 120;

export async function pollDraftJob(jobId: string, onStage?: (stage: string) => void): Promise<void> {
  let lastStage = "";
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const status = await fetch(`/api/admin/content/draft-jobs/${jobId}`);
    if (!status.ok) continue;

    const job = (await status.json()) as { state: string; stage?: string; error: string | null };
    if (job.stage && job.stage !== lastStage) {
      lastStage = job.stage;
      onStage?.(job.stage);
    }
    if (job.state === "done") return;
    if (job.state === "failed") throw new Error(job.error || "The pipeline failed.");
    // The server forgot the job -- restarted, most likely. The work may well
    // have finished, so return and let the caller refresh rather than report
    // a failure for something that might have succeeded.
    if (job.state === "unknown") return;
  }
  // Naming the stage it was stuck on turns a useless timeout into a report.
  throw new Error(`Gave up after 8 minutes, stuck at: ${lastStage || "unknown"}`);
}
