# Acceptance checklist — the repositioned product

Work through this in the deployed app before showing anyone. Each item has a
**pass condition**, not a "looks fine" — the point is to catch the gap between
what the strategy says and what the screen actually does.

Order matters: the demo path first, because that is the one you will be
walking a stranger through.

---

## A. The wedge — student vs CFI perception gap

Needs a flight where BOTH the student and the instructor have submitted
assessments. If none exists, create one before starting.

- [ ] **A1.** `/flights/[id]/debrief/compare` renders as prose, not a table.
      **Pass:** you see "How you saw it" / "How your instructor saw it" /
      "Where your views differ". **Fail:** a Student | Instructor | status
      grid — that means an old build is deployed.
- [ ] **A2.** The headline still reads *Where you and your instructor landed*.
- [ ] **A3.** The summary line leads with agreement, e.g. "You and your
      instructor saw 4 of 6 the same way."
      **Fail:** anything that leads with the number of disagreements.
- [ ] **A4.** A task they agreed on shows NO "where your views differ" block.
- [ ] **A5.** Read every sentence on the page aloud. **Pass:** nothing implies
      the student was wrong, the instructor was wrong, or that the instructor
      failed to explain something.
- [ ] **A6.** Same section on `/results` and `/review` is headed
      *Where You and Your Instructor Saw It Differently*.
- [ ] **A7.** Where an instructor left a note on a task, the note appears
      instead of a generated sentence.

## B. Recurrence across instructors

Needs a student with 2+ instructors and a skill flagged in 2+ lessons
spanning them. The video-demo student is seeded for exactly this.

- [ ] **B1.** `/cfi/students/[id]/handoff` shows a **Still showing up** card.
- [ ] **B2.** It reads *"...has come up in N lessons with 2 instructors."*
      **Fail:** no instructor count — the data has one CFI, or the build is old.
- [ ] **B3.** The timeline lists each lesson with a date and instructor name.
- [ ] **B4.** The closing note frames it as the skill persisting, NOT as
      anyone failing to fix it.
- [ ] **B5.** `/progress` (as the student) shows the same theme with the
      instructor count.
- [ ] **B6.** A student with only one instructor shows the theme WITHOUT an
      instructor count — no "with 1 instructors".

## C. Handoff brief

- [ ] **C1.** `/cfi/students/[id]/handoff` includes, in order: last lesson,
      objectives, the perception gaps, the recurrence timeline, student prep,
      last instructor's note, and a **Recommended Starting Point**.
- [ ] **C2.** The starting point is a concrete action, not a list.
- [ ] **C3.** Viewing as a CFI who did NOT fly the last lesson shows the
      "You didn't fly the last lesson" line.
- [ ] **C4.** Perception gaps show only where they differed — agreed tasks
      are absent.

## D. Adoption — the CFI must feel helped, not measured

**Two different bars, because the two modes are different products.** An
earlier version of this checklist applied the solo bar to guided mode and
concluded guided mode was broken. It isn't — in guided mode the student and
instructor are standing next to each other, and the "wait" is the CFI saying
"your turn" while the student rates on their phone. Time the whole co-present
debrief, not the CFI's screen count.

### D1a — freeform and solo orgs
- [ ] **Stopwatch, tap-record to walking away: under 2 minutes, one screen,
      zero typing.** This is the claim the marketing pages make for solo
      pilots and freeform schools. If it fails, the pitch is wrong.

### D1b — guided orgs (schools; the demo org)
The path is: pick tasks → CFI rates → hand over → student rates → record →
Finish on /review.
- [ ] **Time the whole thing, both people, as one continuous session.**
      Compare it against the 10–15 minutes the debrief already took without
      the app. **Pass: AfterFlight adds only a couple of minutes to something
      that was happening anyway.** Fail: it roughly doubles the debrief.
- [ ] After the CFI submits, their screen reads **"Hand it over"** and names
      the student. **Fail:** "Waiting on the student's self-assessment" —
      old build.
- [ ] The CFI's page advances **on its own** once the student submits; nobody
      has to refresh or hunt for a button.
- [ ] A student sitting elsewhere sees "your turn" on `/home`.
- [ ] Neither person can see the other's ratings before both submit. **This is
      the property that makes /compare mean anything — check it directly.**

### D2–D6 — applies to both modes
- [ ] **D2.** No mandatory AI-review or approve step after recording.
- [ ] **D3.** In freeform, no ACS grid at all. In guided, the ratings step is
      the CFI's own assessment — not a review of something the AI proposed.
- [ ] **D4. NEGATIVE TEST.** Search the whole app as an admin for anything
      resembling instructor scoring: debrief-quality score, CFI ranking,
      instructor effectiveness, a per-instructor column, an instructor
      leaderboard. **Pass: you find none.**
- [ ] **D5.** `/admin/insights` "Needs Review" contains only Repeated
      Deficiency and Repeated Carry-Forward. **Fail:** "Limited Feedback"
      still appears — old build.
- [ ] **D6.** `npx vitest run lib/no-instructor-scorecard.test.ts` passes.

## E. Trust

- [ ] **E1.** `/data-handling` loads **logged out**.
- [ ] **E2.** It states plainly that the recording is never stored, and does
      NOT overclaim — it should concede audio travels to the transcription
      provider in transit.
- [ ] **E3.** `/admin/data-handling` is reachable from the admin nav
      ("Data & Consent"), not just by typing the URL.
- [ ] **E4.** It shows this org's actual retention setting.
- [ ] **E5.** Starting a debrief shows the consent step BEFORE recording.
- [ ] **E6.** As a solo pilot the consent copy reads "I agree", not "We agree".
- [ ] **E7.** Deepgram opt-out is live in the deployed build. Confirm
      `NEXT_PUBLIC_DEEPGRAM_ALLOW_MIP` is unset in the deployment.
      Remember it is inlined at BUILD time — changing it needs a rebuild.

## F. Debrief Replay

- [ ] **F1.** A completed debrief offers audio, and it plays.
- [ ] **F2.** It attributes guidance to the instructor by name.
- [ ] **F3.** It never says "Work on" immediately after "focusing on".
- [ ] **F4.** As a solo pilot, it never references an instructor who does not
      exist.

## G. Solo path (task #157)

- [ ] **G1.** `/signup/student` with a fresh email sends a link.
- [ ] **G2.** Clicking it lands in a working account.
- [ ] **G3.** The org is kind `individual` with `freeform` guidance mode.
- [ ] **G4.** `/home` renders with no CFI-shaped empty states and no
      "waiting on your instructor".
- [ ] **G5.** A full solo debrief completes end to end.
- [ ] **G6.** The 3-free-flights entitlement shows correctly.

## H. Marketing surfaces

- [ ] **H1.** Homepage eyebrow reads *Two views of the same flight.*
- [ ] **H2.** Under the CTA: "Nothing you say is stored as a recording",
      linking to `/data-handling`.
- [ ] **H3.** Who-It's-For student card mentions flying on your own.
- [ ] **H4.** `/instructors` links the CFI quickstart; `/schools` links
      how-it-works and data-handling.
- [ ] **H5.** Footer links all three docs.
- [ ] **H6. NEGATIVE TEST.** Search the site for retired claims:
      "AI flight debrief", "continuity layer", "nobody supports handoffs",
      "nobody tracks study", "we evaluate instructor quality".
      **Pass: none present.**
- [ ] **H7.** KNOWN OPEN: the hero headline and the "Too much of the debrief
      gets lost" problem section still carry old positioning. That is stage
      two, deliberately held pending the CFI calls (task #158). Confirm it is
      still the ONLY place old positioning survives.

## I. Regression — the things most likely to have broken

- [ ] **I1.** A debrief with no assessments still renders results.
- [ ] **I2.** A brand-new student with zero flights sees empty states, not errors.
- [ ] **I3.** A student with one lesson shows no recurrence card (needs 2+).
- [ ] **I4.** Existing debriefs from before today still open.
- [ ] **I5.** `npx tsc --noEmit`, `npx eslint`, `npx vitest run` all clean.

---

## If something fails

Most likely cause, in order:
1. **An old build is deployed.** Check the route list includes
   `/data-handling` and `/admin/data-handling`.
2. **Demo data is stale.** The video-demo history self-heals on the next
   `/api/demo/enter`, but only in a non-deployment environment.
3. **The data genuinely has one instructor**, so B2 cannot pass — that is
   correct behavior, not a bug. Use the seeded demo student.
