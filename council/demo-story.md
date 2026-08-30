# AFTERFLIGHT vs FLIGHTSENSE vs ATLAS — THE ONLY DIFFERENCES THAT SURVIVE CONTACT
Verified live 30 Aug 2026 by adversarial refutation (79 competitor pages + JS bundles fetched, not marketing summaries).

## A. WHAT SURVIVED — say these

| # | Exclusive | Why the competitors cannot do it | Who it's for |
|---|---|---|---|
| 1 | **The student's own rating is compared against the CFI's, and disagreement is flagged** | FlightSense's own docs: *"All debrief log content is **read-only for students**. Your instructor handles all grading."* Proficiency is "an average of the task scores **your instructor** has entered." A student self-debrief exists, but **no student-side grade exists** — there is nothing to diff. Atlas has no self-rating surface on any public page. | Student + CFI |
| 2 | **The same weakness detected recurring across DIFFERENT instructors** | FlightSense analyzes "up to the most recent 15 logs" for "repeated themes" — with **no instructor dimension**. Its instructor-side evaluation is scoped the opposite way ("drawn from debriefs **they authored**"). Atlas shows "which instructor they're paired with" — roster pairing, not recurrence. | School + CFI |
| 3 | **The debrief is spoken back to you** | FlightSense: zero TTS/playback across 72 pages; audio is input-only and the local copy is deleted after processing. Atlas *has* an ElevenLabs TTS pipeline — **but for radio-trainer voices**, not the debrief. | Student |
| 4 | **A synthesized next-CFI brief** (not a shared page, not free-text notes) | FlightSense has manual free-text "Notes... for handoff context" and a PDF "handoff packet" export. Atlas's "share it to their next CFI" is flagged **SOON — not shipped**. Nobody *generates* the brief. | CFI + School |
| 5 | **Works on Android** | Zero occurrences of "Android" across all 72 FlightSense pages. No Google Play listing. Docs route users to "iOS Settings > FlightSense." The web Admin Portal doesn't rescue it: *"Line instructors and students do not have Admin Portal access."* | Student + CFI |

## B. WHAT DIED — never say these

| Killed claim | The evidence that kills it |
|---|---|
| ~~"Nobody supports a solo debrief with no instructor"~~ | FlightSense docs, verbatim: *"Students self-debriefing after solo or dual training events (voice only)"*, with a **Skip** button that "proceeds without instructor association." |
| ~~"Neither produces audio output"~~ | Atlas's privacy page lists **ElevenLabs — text-to-speech**; terms name "radio-trainer audio." Say **"nobody speaks the *debrief* back to you"** instead. |
| ~~"Nobody tracks whether the student studied"~~ | Atlas: *"See what they studied, where comprehension is thin"*; *"When a student goes quiet or slides on a topic, you see it before the no-show."* |
| ~~"Atlas requires a recorder cable"~~ | The cable is **included, not required**, on Flightdeck only. CFI Pro ($490) and Student ($490) ship no hardware. Flightdeck's debrief is built from the **instructor's notes**. |
| ~~"Nobody addresses instructor handoff"~~ | FlightSense's FAQ (extracted from Nuxt bundle `/_nuxt/BRouAzfG.js`): *"Schools tell us this makes handoffs about ten times easier, and it's often **the first problem they feel us solve**."* Claim only the **synthesis**. |

## C. THINGS THAT WOULD EMBARRASS YOU IN THE ROOM
- **Atlas already ships a signed recording-consent flow.** Privacy §5b: *"Before a cockpit recording begins, the recording user must affirm that all required participants have consented"* — and they store **"recording-consent evidence"** as a first-class data type. AfterFlight has consent-gated capture but **no consent artifact and no retention policy.** This is the riskiest surface in the category and Atlas is ahead on it.
- **Atlas runs on Claude and ElevenLabs and says so publicly.** Any "we use frontier models" framing is neutralized.
- **Atlas already claims portability**: "Portable proficiency records across campuses" and CFI Pro's "across every school you fly for." The record-follows-the-person pitch is occupied.
- **FlightSense pricing is now $15/mo with a real free tier and free guest seats** that don't count against the seat limit. The earlier "no free tier" finding was stale.
- **FlightSense signature integrity** hashes grades against a signed snapshot — tampering invalidates the signature.
- **Atlas sells P&L directly**: *"One dropout can mean $8k–15k of dual you never bill"* and CFI hour tracking to "plan hiring before they leave."
- **FlightSense now has a full ops platform.** Side by side, an owner sees a debrief tool vs a business system. Do not invite that comparison.

## D. THE 3-MINUTE DEMO

**Governing rule: the CFI is the veto. Nothing on screen may look like it grades the instructor.**
Render recurrence as a timeline of the **skill**, with instructor names as neutral context markers. Never a per-instructor column, never a per-instructor rollup. If a chief instructor can read a CFI scorecard off the screen, the CFIs stop talking into it and the product dies.

**0:00–0:20 — The cost, not the product.**
> "Your instructor is late for his next student. He bills flight, not ground. So the debrief is 'good job, see you Thursday.' That's not a bad instructor — that's the pay structure. AfterFlight doesn't ask him for more minutes. It uses the ninety seconds he already spends talking."

**0:20–0:50 — Zero keystrokes. (Not exclusive — but it's why CFIs tolerate the product.)**
CFI taps record, talks the way he already talks, taps stop, walks away.
> "That's the whole CFI workflow. No ACS grid to confirm, no AI grades to review, no signature. He talked, and he left."

**0:50–1:15 — The student's side, and the audio.**
Student records her own take in the car; her spoken recap plays — five real seconds of it.
> "She gets the debrief back in her ear on the drive home, in her instructor's words. Nobody else in this category speaks the debrief back to you."

**1:15–2:00 — THE REVEAL.**
Screen: `/compare` — Crosswind Landings. Student: *Proficient*. Instructor: *Needs Work*. **SIGNIFICANT DISAGREEMENT.**
> "She thinks she's got crosswinds. He thinks she doesn't. Both of them are being honest, and neither one knows the other said it."
> "FlightSense records a student self-debrief too. But their own documentation says student content is read-only — the instructor does all the grading. There's no student rating to compare. **They hold one half of this. Nobody has ever put the two halves next to each other.**"

Beat. Timeline expands — the *skill*, not the instructors.
> "And it's the third lesson it's happened. Two different instructors taught those lessons. Neither one could see the other's. **It didn't come back because she's a weak student or because anyone taught it badly. It came back because nobody was counting.**"

**2:00–2:30 — The handoff.**
Marcus leaves for the regionals. The synthesized brief appears: where she is, what's unresolved, the persistent disagreement, the first question to ask.
> "Every product here can export a record. FlightSense will hand the next instructor a PDF; Atlas has a share-page coming. **Nobody writes the brief.** Today this is a hallway conversation that happens if two people happen to overlap — and costs about five repeat hours when they don't."

*If challenged on handoff:* "FlightSense makes the record available — that's real and it matters. What nobody does is synthesize it into what the next instructor should actually do on Tuesday."

**2:30–3:00 — Honesty, then close.**
> "Straight answers on two things. This is a demo school — invented students, seeded history. And the persistence view needs about four lessons across two instructors before it says anything true, so we seed your last month of debriefs at onboarding and it talks in week two, not month six."

**Closes**
- **Student:** "You'll never find out in month four that your instructor has been worried about something since June."
- **CFI:** "You talk for ninety seconds and walk away. Everything else here was built so you'd never have to open it."
- **Owner:** "Your instructors will leave. This is the only thing you own that makes the next one start at hour twenty-eight instead of hour zero."

## E. SEED DATA
- 1 hero student, ~28 hrs, **7 completed lessons**.
- **2 instructors** — Marcus (lessons 1–4), Dana (5–7). The instructor change *is* the demo.
- Crosswind landings NEEDS_WORK in lessons **3, 5, 7** — spanning both CFIs — with self-vs-CFI rank distance ≥2 in at least two.
- One **improving** skill (radio work) across the same span, so the timeline isn't uniformly negative.
- 4 background students, 2–5 lessons each, so the roster doesn't look staged.
- **Real cached TTS on lesson 7.** Synthetic-sounding audio kills the segment.

## F. CUT FROM THE DEMO
ACS grading and proficiency by Area of Operation · the raw transcript · study resources and FAA-cited chat · study-open tracking · Part 141 records, signatures, exports · scheduling and billing · radio practice · FlightScore · the content engine · school-wide insights dashboards · debrief-quality scoring and CFI analytics (you don't have them, FlightSense does, and naming them hands over the frame).

## G. BEFORE THE FIRST REAL MEETING
1. **Write the retention and deletion policy.** Audio retained N days then text-only; school-controlled deletion. Atlas already stores consent evidence as first-class data; you will be asked and you currently have no answer.
2. **Build the consent artifact** — student enrollment consent, CFI employment acknowledgment, both recorded against the org.
3. **Ship `COUNT(DISTINCT instructor_id)`** and the skill-timeline view. One day.
4. Never build a per-instructor rollup on top of it.
