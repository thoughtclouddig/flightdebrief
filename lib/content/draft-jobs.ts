import { randomUUID } from "crypto";

/**
 * In-flight drafting jobs.
 *
 * Writing an article now takes minutes: a web-search research pass, four
 * model calls, and an image. Replit's proxy gives up on the HTTP request long
 * before that and returns its own 502, so the browser saw a failure while the
 * work carried on and the article landed anyway -- the worst of both, since
 * the desk reported an error for something that succeeded.
 *
 * So the request starts the job and returns immediately; the desk polls. Held
 * in memory rather than a table because a job is only interesting while it's
 * running: a restart loses the status, and the article it produced is still
 * in the database where it belongs.
 */
export type DraftJobState = "running" | "done" | "failed";

export interface DraftJob {
  id: string;
  state: DraftJobState;
  /**
   * What the job is doing right now, in the user's words.
   *
   * This exists because the stage was only ever printed to the server log,
   * and a log you cannot reach is the same as no log: a run that stalls shows
   * "researching" for eight minutes and tells you nothing. The desk shows
   * this instead.
   */
  stage: string;
  error: string | null;
  articleId: string | null;
  startedAt: number;
}

/** Passed into the work so it can report progress. */
export type ReportStage = (stage: string) => void;

const jobs = new Map<string, DraftJob>();

/** Long enough to survive a slow pipeline, short enough not to leak. */
const RETENTION_MS = 30 * 60 * 1000;

function sweep(): void {
  const cutoff = Date.now() - RETENTION_MS;
  for (const [id, job] of jobs) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}

export function startDraftJob(work: (report: ReportStage) => Promise<{ articleId: string }>): DraftJob {
  sweep();
  const job: DraftJob = {
    id: randomUUID(),
    state: "running",
    stage: "Starting",
    error: null,
    articleId: null,
    startedAt: Date.now(),
  };
  jobs.set(job.id, job);

  // Deliberately not awaited: the caller returns while this runs. Any throw
  // is captured onto the job rather than becoming an unhandled rejection.
  void work((stage) => {
    job.stage = stage;
  })
    .then(({ articleId }) => {
      job.state = "done";
      job.stage = "Done";
      job.articleId = articleId;
    })
    .catch((err: unknown) => {
      console.error("[content-pipeline] draft job failed:", err);
      job.state = "failed";
      // The stage is left as it was: which step it died on is the useful
      // half of the report.
      job.error = err instanceof Error ? err.message : "Drafting failed.";
    });

  return job;
}

export function getDraftJob(id: string): DraftJob | null {
  return jobs.get(id) ?? null;
}
