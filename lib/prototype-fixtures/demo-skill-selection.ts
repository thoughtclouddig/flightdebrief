/**
 * Hand-off between the two independent, fixture-backed public demo screens
 * (components/student/flights/add-flight-demo.tsx and components/student/
 * debrief/guided-debrief-demo.tsx) -- they're separate page components with
 * no shared React state and no real backend to persist a selection against
 * (there is no real flight_id in the public demo), so sessionStorage is the
 * smallest mechanism that carries "what did you work on" from Add Flight
 * into the debrief that follows it, without touching any real schema, API,
 * or persistence. Client-only and ephemeral by design -- it resets when the
 * tab closes, which is exactly right for a stateless walkthrough.
 *
 * Read defensively: sessionStorage can be unavailable (SSR, privacy mode)
 * or hold malformed JSON from an older shape -- both fall through to an
 * empty array, which every caller already treats as "use the fixture
 * default," never as an error.
 */

export interface DemoSelectedTask {
  taskCode: string;
  label: string;
}

const STORAGE_KEY = "afterflight-demo-skill-selection";

export function saveDemoSkillSelection(tasks: DemoSelectedTask[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (e.g. privacy mode) -- the debrief demo falls
    // back to its own fixture default, which is still a coherent story.
  }
}

export function readDemoSkillSelection(): DemoSelectedTask[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is DemoSelectedTask => typeof t === "object" && t !== null && typeof t.taskCode === "string" && typeof t.label === "string",
    );
  } catch {
    return [];
  }
}
