# AFTERFLIGHT — STRATEGIC RESET BRIEF (31 Aug 2026)

## THE DECISION
Can AfterFlight become a differentiated, STUDENT-FIRST AI training coach for
Part 61 aviation, distributed through CFIs, at ~$20/month -- or is FlightSense
evidence the opportunity is already too weak?

Options: (1) continue school-facing, (2) pivot student-first Part 61 coach,
(3) become an intelligence/integration layer, (4) materially change product,
(5) stop.

## WHAT CHANGED SINCE THE 30 AUG COUNCIL
FlightSense is not "another debrief app." It is a full school training +
operations platform: voice debrief, ACS-linked grading, predicted ACS tasks,
training states (Introduce/Practice/Demonstrate/Standard), course progress,
proficiency, stage checks, checkride readiness, training records, signatures,
Part 141 support, scheduling, dispatch, billing, maintenance, and an AI
assistant ("Amelia"). Its message is essentially "the debrief creates the
record" -- very close to AfterFlight's ORIGINAL thesis, but wired into the
school's operating system.

THE FOUNDER'S OWN FRAMING OF THE PROBLEM:
"A school owner could reasonably say: FlightSense gives me debriefing, ACS
grading, proficiency, readiness, records, scheduling, billing and operations.
Why would I also buy AfterFlight?" -- and AfterFlight currently has no strong
school-facing answer. So "school = primary payer" must be re-tested.

## THE PROPOSED NEW THESIS
"AfterFlight should stop trying to be the school's debrief/training-management
system and become the PILOT'S AI TRAINING COACH -- turning each real flight and
debrief into personalized instruction, knowledge checks, next-flight
preparation and explainable progress."

New product loop:
Flight -> Debrief -> Diagnose -> TEACH -> Check Understanding -> Prepare Next
Flight -> Update Progress

Contrast the founder draws:
- FlightSense = CFI grades training -> system records and tracks progress
- AfterFlight = CFI talks normally -> system infers structure -> TEACHES the student

## THE AI TRAINER CONCEPT (the core bet)
Each debrief becomes a personalized micro-lesson (3-7 min):
 - "What your instructor meant" (plain language translation)
 - "Why this happens" (aerodynamic/behavioral principle)
 - "What to picture" (mental model)
 - "Common mistake"
 - "What to do next time" (2-4 concrete cues)
 - FAA source as EVIDENCE LAYER, not the student experience
Then a 3-5 question knowledge check (recall / application / scenario /
reflection) with immediate feedback tied back to their actual debrief.
Learning design: retrieval practice, spaced repetition, interleaving,
reflection-before-feedback, scenario-based, chunking, positive reinforcement.

## CFI WORKFLOW (the adoption constraint)
Ideal: Tap Record -> 60-90s normal debrief -> Tap Stop -> Leave.
AfterFlight infers ACS areas, strengths, weaknesses, proficiency signals,
instructor emphasis, next-flight focus. Optional light confirmation only.
"You teach. AfterFlight handles the follow-through."
CFI IS THE ADOPTION VETO. Never instructor scoring, surveillance, extra
documentation, extra screens, or mandatory review.

## SURVIVING DIFFERENTIATORS (verified 30 Aug)
1. Student-vs-CFI perception gap. /compare exists, renders only after BOTH
   submit independently, walks ACS tasks, computes rank distance, classifies
   none/minor/significant. FlightSense has student self-debrief but its
   student content is READ-ONLY ("your instructor handles all grading") so
   there is no student-side grade to join against. Atlas exposes no
   self-rating surface.
2. Cross-instructor recurrence: same skill across lessons AND across different
   instructors. Nobody else computes this. MUST be framed as the student's
   SKILL, never the instructor. No CFI leaderboards/scorecards ever.
3. Synthesized next-CFI handoff brief (Atlas's share-page is "SOON"; FlightSense
   has manual notes + PDF export, no synthesis).
4. Speaking the DEBRIEF back to the student (Atlas has ElevenLabs TTS but for
   radio-trainer voices; FlightSense is audio-in only). Not a moat -- TTS is
   commodity -- but a UX differentiator.
5. AfterFlight never stores the recording (browser streams to Deepgram,
   discarded; mip_opt_out now on). Navi and Atlas ship recorder cables.

## PROPOSED ICP / PAYER / DISTRIBUTION
- ICP: active Part 61 STUDENT pilots (expand later to IR/CPL/recurrent/BFR/IPC/
  rusty pilots).
- Payer: STUDENT. CFI: FREE. School: optional facilitator.
- CFI = champion + referral/distribution channel.
- Three participation modes:
  1. Full CFI participation (best; true comparison)
  2. Lightweight CFI contribution -- 60-90s debrief, NO app install/account
  3. Student-only (must NOT claim "student vs CFI comparison")

## PROPOSED PRICING & REFERRAL
- $19.99/mo student; ~$169/yr; CFI free.
- $25 one-time CFI payout per new PAYING student.
- Launch: "Founding CFI" -- free access + $50 per converted student for first 5,
  then $25.
- Payout gated: verified CFI, new customers only, no trial payout, delayed until
  2 monthly charges clear or annual refund window closes, requires real product
  usage, void on refund/chargeback, permanent attribution, no self-referrals,
  duplicate detection, new-CFI caps, manual anomaly review.

## FOUNDER'S ILLUSTRATIVE FINANCIALS (to be stress-tested)
$19.99/mo: 50 subs = $11,994 ARR; 100 = $23,988; 500 = $119,940;
1,000 = $239,880; 2,500 = $599,700; 5,000 = $1,199,400.
CFI channel at 6 paying students/CFI: 100 CFIs = ~$144k ARR; 500 = ~$720k;
1,000 = ~$1.44M; 2,500 = ~$3.6M; 5,000 = ~$7.2M.
LTV: 6mo = $119.94 (referral 20.8% of revenue); 8mo = $159.92 (15.6%);
12mo = $239.88 (10.4%).
FOUNDER'S OWN STATED RISK: churn, not referral cost. Churn points: after solo,
after checkride, if AI Trainer feels generic, if CFI stops participating, if
student stops flying, novelty wearing off.

## PROPOSED GTM TEST
20 Founding CFIs, free access + $50/paying student for first 5, target 5
students each = ~100 students top-of-funnel. Measure referrals, trials, paid
conversion, debrief frequency, AI Trainer usage, quiz completion, 30/60/90-day
retention, CFI usage, CFI recommendation rate, CAC, refund rate.

## PROPOSED PROTOTYPE (before any rebuild)
Student Mia, instructor Jake, crosswind + short-field landings. 12 screens:
flight complete, start debrief, structured result, student reflection,
perception gap, personalized AI lesson, 3-5 question knowledge check,
next-flight prep, explainable readiness, recurring skill timeline, Debrief
Replay, landscape training workspace.
Question it must answer: "Does AfterFlight actually feel like an instructor
between flights?"

## UI QUESTION
Phone/portrait = everyday: capture, recap, AI lesson, quiz, Replay, next-flight
prep, quick progress. Tablet/landscape = deeper: lesson review, history,
readiness, patterns, comparison, next-CFI brief, timeline.
"Mobile coach + landscape training workspace", NOT "ERP shrunk onto a phone."

## READINESS POSITIONING
Not "72% ready" but "WHY you are not ready yet, and exactly what to do next" --
blockers, what improved, what moves readiness forward.
Open question: how to compute readiness WITHOUT pretending AI inference equals
official instructor certification.

## SECTION 43-50: ADJACENT PRODUCTS (evaluate SEPARATELY from near-term roadmap)
- **Lesson Prep / NEXT FLIGHT** -- evolved existing surface; between-flight prep
  from last debrief + unresolved items + instructor emphasis + quiz performance.
  Founder thinks this stays INSIDE core, not a separate app.
- **Chair Flying** -- student picks aircraft/maneuver/airport/scenario;
  AfterFlight walks them through verbally; student responds by voice; evaluates
  sequence, setup, callouts, flows, airspeeds, radio, decision points, risk
  management, missed steps. No school or CFI dependency. Candidate FREE
  acquisition surface.
- **Checkride Readiness** -- high intent, high urgency, strong WTP, SEO/AEO
  surface. Core / standalone / free-with-paid-detail / certificate SKU?
- **Solo Readiness** -- should it precede Checkride Readiness?
- **Radio Coach** -- belongs inside, or distraction? (NOTE: a radio practice
  module ALREADY EXISTS and ships today.)
- **META GLASSES / MULTIMODAL (long-term R&D option, NOT roadmap)** --
  smart-glasses first-person video + cockpit/intercom audio + ATC audio + pilot
  speech + sim telemetry + GPS/ADS-B/aircraft state. Moves AfterFlight from
  "what people SAY after the flight" to "what actually HAPPENED during it."
  Can be proven WITHOUT hardware via an X-Plane/MSFS simulator PoC (screen
  capture + mic + telemetry). Founder explicitly wants this evaluated as a
  ceiling-changing strategic option, NOT a near-term dependency.

## FORCE-RANK REQUIRED
Rank each adjacent concept on: user pain, urgency, WTP, acquisition potential,
CFI dependency, school dependency, build complexity, differentiation, retention
impact, strategic fit, defensibility. Then: BUILD NOW / PROTOTYPE / LATER /
DO NOT BUILD.

## HARD CONSTRAINTS
- Do not protect the founder's feelings.
- Do not say "competition validates the market."
- STOP must be a live option.
- Not looking for another vague pivot -- need a precise answer.
- Willing to change: ICP, payer, GTM, pricing, product emphasis, UI, roadmap.
- The question is NOT "can this be built" -- most of it is built. It is
  "is this now the right product and business to build?"

## THE HARDEST QUESTION (founder's own words)
"Assume FlightSense wins the flight school. Assume the school already has ACS
grading, readiness, progress, training records, scheduling, billing. Then ask:
why would a student still want AfterFlight? The answer cannot merely be nicer
summaries, audio recap, perception gap, more continuity. It needs to be strong
enough that the student believes AfterFlight actively makes me a better pilot
between flights. If that cannot be demonstrated, the student-paid model is weak."
