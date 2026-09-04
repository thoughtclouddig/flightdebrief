import { agreement, levelLabel } from "@/lib/student/assessment";
import { skillForObjective } from "@/lib/prototype/assessment";
import {
  CONCEPTS,
  INSTRUCTOR,
  LAST_FLIGHT,
  NEXT_LESSON,
  PERCEPTION_GAPS,
  STRUCTURED,
  type GapRow,
} from "@/lib/prototype-fixtures/vector-data";

/**
 * Chair Flying.
 *
 * The defining rule, and everything below exists to keep it true: a drill is
 * generated from what actually happened on the student's last flight. This is
 * not a study library with a crosswind chapter in it. If the last flight had
 * no contested objective there is no drill, and `recommendedDrill()` returns
 * null rather than reaching for generic content.
 *
 * NOT AN ASSESSMENT LAYER. Nothing here scores, tallies, grades or ranks. The
 * only performance model in the product is the FITS-derived one in
 * lib/performance-levels.ts, and Chair Flying only ever READS it -- to decide
 * what is worth rehearsing and to explain why. A response to a rehearsal
 * choice reinforces or clarifies and then moves on. There is deliberately no
 * `correct` flag on an option, because a boolean is the thing a future session
 * would count, and a count is a score.
 *
 * The loop this closes:
 *
 *   Flight -> Debrief -> specific training need -> Chair Flying -> Next flight
 */

/**
 * Guided is the only mode built. The other two are named here because the
 * step shape below has to survive them, not because they exist:
 *
 *   guided     Vector sets the scene and offers the choices. Built.
 *   recall     Vector sets the scene only; the student talks the sequence
 *              through from memory. `looksFor` / `idealAnswer` on each step
 *              are the seam for it -- free-text coverage, already evaluated by
 *              evaluateChairFly() in lib/ai/vector.ts.
 *   challenge  Vector changes the scenario mid-drill ("the wind just shifted
 *              20 degrees right -- what changes?").
 *
 * A future spoken mode is a delivery change on top of `recall`, not a fourth
 * mode. No speech analysis in this pass.
 */
export type ChairFlyMode = "guided" | "recall" | "challenge";

export interface ChairFlyOption {
  id: string;
  text: string;
  /**
   * What Vector says when this is chosen. Reinforces, or corrects the
   * reasoning. Never "right" or "wrong" -- see the header note.
   */
  response: string;
}

export interface ChairFlyStep {
  id: string;
  /**
   * `judgment` marks the ADM beat. A rehearsal that is only procedure teaches
   * a student to fly a sequence rather than to decide, and the decision is
   * the part that keeps them alive. At least one is required -- asserted in
   * chair-fly.test.ts.
   */
  kind: "technique" | "judgment";
  /** Where the student is. Present tense, second person, in the airplane. */
  scene: string;
  prompt: string;
  options: ChairFlyOption[];
  /** The coaching point, shown after any choice. Brief by contract. */
  coaching: string;
  /**
   * Set on the beat that IS the instructor's note from the last debrief, so
   * the UI can attribute it to him rather than to Vector. Exactly one step
   * carries this: the drill exists because of it.
   */
  instructorNote?: string;
  /** Free-text seam for a future recall / spoken mode. Unused by guided. */
  looksFor: string[];
  idealAnswer: string;
}

export interface ChairFlyDrill {
  objective: string;
  /** Matching skill row, when the objective has one. */
  skill: string | null;
  mode: ChairFlyMode;
  /** The conditions, stated once. Reused from the last flight's own airport. */
  scenario: string;
  /** Why Vector picked this drill, assembled from the debrief. */
  reason: {
    studentLabel: string;
    instructorLabel: string;
    instructorName: string;
    date: string;
    /** The instructor's own words. A recommendation without evidence is a guess. */
    evidence: string;
    /** One sentence a student reads before deciding to spend four minutes. */
    line: string;
  };
  steps: ChairFlyStep[];
  /** 2-3 things to carry into the next flight. Not a summary of the drill. */
  carryForward: string[];
  guardrail: string;
  estimatedMinutes: number;
  nextFlight: { when: string; lesson: string; focus: string };
}

/** The seed writes `--` where prose wants an em dash. Fix once, at the edge. */
function dashes(s: string): string {
  return s.replace(/ -- /g, " — ");
}

/**
 * Which objective is worth rehearsing.
 *
 * The student rating themselves ABOVE the instructor is the highest-value
 * case in the product, and it is the one a student will not self-select: they
 * think the thing went fine, so they would never choose to practice it. It is
 * also the drill whose reason explains itself -- "you called it Felt Solid,
 * Jake called it Improving, here is what he saw" needs no further argument.
 *
 * Largest gap first; ties break toward the earlier objective, which is lesson
 * order. Falls back to whatever the instructor left open, so the rule still
 * produces something on a flight where the two agreed about everything.
 */
export function contestedObjective(gaps: GapRow[] = PERCEPTION_GAPS): GapRow | null {
  const byDistance = (g: GapRow) => rank(g.studentLevel) - rank(g.instructorLevel);
  const contested = gaps
    .filter((g) => agreement(g.studentLevel, g.instructorLevel) === "student_higher")
    .sort((a, b) => byDistance(b) - byDistance(a));
  if (contested[0]) return contested[0];
  return gaps.find((g) => g.instructorLevel !== "INDEPENDENT") ?? null;
}

function rank(code: GapRow["studentLevel"]): number {
  return ["LEARNING", "NEEDS_COACHING", "INDEPENDENT"].indexOf(code);
}

/* ------------------------------------------------------------- scenarios */

/**
 * Authored scenario content, keyed by lesson objective.
 *
 * The SELECTION, the reason, the evidence, the carry-forward and the link to
 * the next flight are all derived from the debrief above. The six beats are
 * written prose, because the prototype has no generation pipeline and the
 * brief was explicit about not adding one. An objective with no entry here
 * has no drill -- which is the correct failure, not a gap to paper over with
 * a generic maneuver.
 *
 * Conditions come from the flight that produced the note: KSQL, Runway 30,
 * left crosswind about 12 knots, the C172S Mia actually flew. With the wind
 * from the left the upwind wing is the LEFT wing and any drift is to the
 * RIGHT; the beats below are written to that and reviewed for it.
 */
const SCENARIOS: Record<string, { scenario: string; steps: ChairFlyStep[] }> = {
  "Crosswind Landings": {
    scenario: `Runway 30 at ${LAST_FLIGHT.route.split(" ")[0]}, left crosswind about 12 knots, the ${LAST_FLIGHT.aircraft.split(" · ")[1]} you flew ${LAST_FLIGHT.date}.`,
    steps: [
      {
        id: "scene",
        kind: "technique",
        scene:
          "Picture yourself on final for Runway 30. The wind is off your left at about 12 knots and you are configured, on speed, coming up on the threshold.",
        prompt: "What are you looking for as you come down final?",
        options: [
          {
            id: "a",
            text: "Centerline, and whether I'm drifting",
            response:
              "That's it. The runway centerline is the reference for the whole approach — you are watching whether the airplane is tracking it or sliding off it, and fixing that early rather than at the threshold.",
          },
          {
            id: "b",
            text: "The aiming point and my airspeed",
            response:
              "Both matter and you should have them. But in a crosswind the question that decides the landing is whether you are tracking the centerline — speed and aiming point are what you have already set up by this stage.",
          },
          {
            id: "c",
            text: "The windsock",
            response:
              "Worth a look earlier in the pattern. On final the airplane is telling you more than the sock is: if you are drifting, the correction is not enough, whatever the sock says.",
          },
        ],
        coaching:
          "Establish the correction early. A crosswind approach that arrives at the threshold uncorrected has to be fixed in the flare, which is the busiest few seconds of the landing.",
        looksFor: ["centerline", "drift", "track", "align"],
        idealAnswer:
          "Whether you are tracking the centerline, and whether the correction you are holding is actually stopping the drift.",
      },
      {
        id: "inputs",
        kind: "technique",
        scene: "You're getting closer. The airplane is holding centerline but you can feel the wind on your left.",
        prompt: "What is each hand and foot doing?",
        options: [
          {
            id: "a",
            text: "Left aileron into the wind, right rudder to keep the nose straight",
            response:
              "Yes — and note they are two separate jobs. Aileron holds you on centerline; rudder points the nose down the runway. Neither one does the other's work.",
          },
          {
            id: "b",
            text: "Crab into the wind and hold it",
            response:
              "A crab tracks the centerline fine, and plenty of pilots fly the approach that way. The part this drill is about is what comes next: before touchdown that crab has to become a wing-low sideslip, or the airplane touches down sideways.",
          },
          {
            id: "c",
            text: "Left aileron and left rudder together",
            response:
              "Not together — those fight each other. Aileron into the wind banks you toward it; rudder has to go the other way to stop the nose following the bank. Left aileron, right rudder here.",
          },
        ],
        coaching:
          "Different jobs, opposite directions. Aileron into the wind holds you over the centerline, rudder keeps the nose aligned with the runway.",
        looksFor: ["aileron", "rudder", "left", "right", "wind"],
        idealAnswer:
          "Left aileron into the wind to stop the drift, right rudder to keep the nose straight down the runway.",
      },
      {
        id: "flare",
        kind: "technique",
        scene: "You begin the flare. The airplane starts drifting right of centerline.",
        prompt: "What do you do?",
        options: [
          {
            id: "a",
            text: "More left aileron",
            response:
              "Right. Drifting right means the correction is no longer enough for the wind, so it needs to grow. You are slower than you were five seconds ago, and slower controls do less work.",
          },
          {
            id: "b",
            text: "Hold what I have and let it settle",
            response:
              "This is the trap. Holding the same input as you slow means the correction is quietly decaying, so the drift keeps growing — the airplane needs more aileron here, not the same amount.",
          },
          {
            id: "c",
            text: "Add right rudder to swing back",
            response:
              "Rudder points the nose; it doesn't move the airplane back over the centerline. Using it that way lands you drifting AND out of alignment. Aileron is the control for drift.",
          },
        ],
        coaching:
          "Control effectiveness falls with airspeed. In the flare you are slower than at any other point in the approach, so the same deflection produces less correction than it did on final.",
        looksFor: ["aileron", "more", "increase", "into the wind"],
        idealAnswer: "More aileron into the wind. The input has to keep growing as the airplane slows.",
      },
      {
        id: "touchdown",
        kind: "technique",
        scene: "The upwind — left — main wheel touches first. You're rolling on one wheel.",
        prompt: "What happens next with the controls?",
        options: [
          {
            id: "a",
            text: "Keep adding aileron as the other wheel settles",
            response:
              "That's the one. The airplane is slowing, so the aileron keeps going in. The downwind main settles on its own; you do not lower it with the controls.",
          },
          {
            id: "b",
            text: "Neutralise the aileron now that I'm down",
            response:
              "This is where the landing gets away from you. Neutralising lets the upwind wing come up and the airplane starts drifting downwind while it's rolling — the correction is needed more now, not less.",
          },
          {
            id: "c",
            text: "Get the nosewheel down for steering",
            response:
              "Too early. Hold the nose off while the elevator still has authority, keep the wings where the wind wants them, and let the nosewheel come down as it will.",
          },
        ],
        coaching:
          "One wheel, then two, then the nose — and the aileron is still going in the whole time. Rudder keeps you straight down the runway.",
        looksFor: ["aileron", "increase", "hold", "nose", "rudder"],
        idealAnswer:
          "Keep feeding aileron in as the downwind main settles, hold the nose off, and keep the airplane straight with rudder.",
      },
      {
        id: "rollout",
        kind: "technique",
        scene: "You're slowing through the rollout. All three wheels are down and the airplane feels settled.",
        prompt: "What happens to your aileron correction as the airspeed decreases?",
        options: [
          {
            id: "a",
            text: "It keeps increasing, toward full deflection",
            response:
              "Yes — and this is the exact point from your debrief. The slower you go the less the controls do, so the input keeps growing right through the rollout to taxi speed.",
          },
          {
            id: "b",
            text: "It comes out now that I'm on the ground",
            response:
              "This is the habit worth breaking. Being on the wheels doesn't stop the wind — it can still lift the upwind wing and push you off centerline while you are rolling. The correction keeps going in.",
          },
          {
            id: "c",
            text: "It stays where it was at touchdown",
            response:
              "Holding it steady feels like keeping the correction, but it isn't: as the airspeed drops that same deflection does less and less. Steady input means a shrinking correction.",
          },
        ],
        coaching:
          "Nothing relaxes until you are at taxi speed. Expect the aileron to reach near-full deflection by the end of the rollout.",
        instructorNote: "Keep the correction in all the way through touchdown.",
        looksFor: ["increase", "more", "full", "deflection", "taxi"],
        idealAnswer:
          "It keeps increasing — near-full deflection into the wind by the time you are at taxi speed. Nothing comes out before then.",
      },
      {
        id: "judgment",
        kind: "judgment",
        scene:
          "Different approach. The airplane is no longer tracking the centerline and you are using bigger and bigger corrections just to stay near it.",
        prompt: "What are your options?",
        options: [
          {
            id: "a",
            text: "Go around",
            response:
              "A completely legitimate answer, and often the best one. A go-around is a normal maneuver, not an admission of anything — and it is always available while you still have the runway to do it.",
          },
          {
            id: "b",
            text: "Go around, and reconsider the runway or the airport",
            response:
              "Even better, because it treats the go-around as the start of a decision rather than the end of one. If the correction is running out, the next question is whether a different runway or a different airport suits this wind.",
          },
          {
            id: "c",
            text: "Keep correcting and try to save it",
            response:
              "This is the one to be honest about. If you are running out of correction near the ground, the airplane is telling you the crosswind is beyond what you can hold — and the fix is to stop the approach, not to hold on harder.",
          },
        ],
        coaching:
          "Running out of aileron is information. Discontinuing an approach is a normal decision available to you at any point, and making it early costs nothing.",
        looksFor: ["go around", "go-around", "divert", "another runway", "discontinue"],
        idealAnswer:
          "Go around. If the correction is running out the crosswind is beyond what you can hold today, which makes a different runway, a different airport, or a different day the real question.",
      },
    ],
  },
};

/* ---------------------------------------------------------------- builder */

/**
 * The drill Vector recommends after the last flight, or null when there
 * isn't one. Null is a real answer: Train falls back to its other
 * recommendations rather than inventing a scenario.
 */
export function recommendedDrill(): ChairFlyDrill | null {
  const gap = contestedObjective();
  if (!gap) return null;
  const authored = SCENARIOS[gap.task];
  if (!authored) return null;

  const skill = skillForObjective(gap.task);
  const concept = skill ? CONCEPTS["crosswind-correction-through-touchdown"] : null;

  return {
    objective: gap.task,
    skill: skill?.skill ?? null,
    mode: "guided",
    scenario: authored.scenario,
    reason: {
      studentLabel: levelLabel(gap.studentLevel, "student"),
      instructorLabel: levelLabel(gap.instructorLevel, "instructor"),
      instructorName: INSTRUCTOR.firstName,
      date: LAST_FLIGHT.date,
      evidence: skill?.instructorEvidence ?? gap.instructorView,
      line: `${INSTRUCTOR.firstName} noticed you were relaxing the crosswind correction during rollout. Rehearse the sequence before your next flight.`,
    },
    steps: authored.steps,
    // The carry-forward is the concept's own next-time list, so what the
    // student leaves with matches what the rest of the product teaches.
    carryForward: (concept?.nextTime ?? STRUCTURED.cockpitCues.slice(0, 3)).slice(0, 3).map(dashes),
    guardrail:
      "Rehearsal only. Your checklist, the POH and your instructor are the authority on procedures and numbers for your airplane.",
    // Derived from the beats rather than written down, so content and claim
    // cannot drift apart.
    estimatedMinutes: Math.max(3, Math.round(authored.steps.length * 0.7)),
    nextFlight: {
      when: NEXT_LESSON.date,
      lesson: NEXT_LESSON.focus,
      focus: STRUCTURED.nextFlightFocus[0]!,
    },
  };
}

/**
 * Kept in the shape the free-text evaluator expects, so the recall seam and
 * the guided UI read one dataset rather than two.
 */
export const CHAIR_FLY = {
  get title() {
    return recommendedDrill()?.objective ?? "Chair fly";
  },
  get steps(): ChairFlyStep[] {
    return recommendedDrill()?.steps ?? [];
  },
};
