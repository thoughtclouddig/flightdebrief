# AFTERFLIGHT — COMPETITIVE REALITY CHECK
Council convened 30 Aug 2026. 4 live research agents, 5 advisors, 5 anonymized peer reviewers, 1 chairman.
Evidence base: `research-dossier.md` (live web research) + `afterflight-inventory.md` (verified from source, not from the pitch).

---

## 1. COUNCIL VERDICT — **YES, BUT PIVOT**

Continue building. But the thesis you are building on is half-wrong, the category word you were going to own is already taken by three competitors, and two of the seven "white space" items in your brief are shipped by someone else today. The pivot is not the product. It is who pays, what you say, and what you do next with a product that is more finished than you realize.

The core finding is narrower and better than "continuity is open." **Continuity is occupied as a word and unoccupied as a mechanism.** FlightSense's launch blog claims "enhanced continuity when transitioning between instructors"; Wingman claims "instructor handoff continuity briefs" verbatim; Aviatize ships "instructor continuity" at $29/aircraft/month. A word three vendors use is a commodity adjective, not a position. But none of them can compute what you can: Aviatize counts instructor *switches*, not skill *recurrence across* instructors; FlightSense's multi-lesson analysis runs a 15-log window with no instructor dimension; FlightSense captures student self-debriefs and instructor debriefs and never diffs them, because self-debrief is a voice-only mode with **no instructor association** — there is no join key. Atlas holds both data sides and never connects them, and cannot without contradicting its own "your roster stays yours, not the school's" pitch to CFIs. Navi debriefs the airplane, not the conversation. All five treat audio as input only; none produces audio out.

You are therefore not late to the mechanism. You are late to the vocabulary, and you were 12 months stale on two features — debrief-quality scoring and CFI-development analytics — both of which FlightSense ships and both of which you should now **abandon permanently**. The second is worse than redundant: it makes the CFI the subject of measurement in a market where every documented adoption failure happened at CFI level. It actively recruits the veto.

The hard truths the council will not let you past. There is **no moat available from data or habit**: CFIs turn over in 12–24 months, students finish in 12–18, and both cohorts churn faster than any switching cost can compound. The school cannot pay — ~$400/month total software budget, 5–15% margins, and your operator advisor said flatly it would pass. The debrief gap is caused by **pay structure**, not tooling: instructors bill flight, get squeezed on ground, and are already late for the next student. And there is **zero demonstrated demand** — no organic post anywhere requests AI debrief, and a free CFI debrief app launched in June 2026 drew *"Why not just put notes on a knee board?"*

But the shutdown case, which was the best-written response in the packet, is the least sound — and four of five reviewers said so. It claims Aviatize already ships your thesis (false: different data model, different claim). It claims ForeFlight closes the window in twelve months (dossier-tagged inference, and the confirmed evidence cuts the other way — CloudAhoy's blog has been silent three years, ForeFlight Debrief explicitly does *not* claim AI, and their instructor page still has no syllabus, grading, or progress tracking). It claims the buyer cannot pay, which is true of schools and false of the market: 75,000–145,000 students already voluntarily spend $600–1,100/year out of pocket. And its closing line — that the code is the only argument left — is a genetic fallacy. How the software came to exist has no bearing on whether the wedge is real.

So: continue. Stop calling it continuity, stop building toward the school's checkbook, ship the one query that makes the mechanism legible, and spend the next two weeks buying information instead of features. The binary of build-vs-stop was the right frame 20,000 lines ago. It is spent.

---

## 2. WHAT CHANGED

**Three of your named competitors were wrong, and the corrections matter more than the confirmations.**

- **"Aviatron / TopGun Training" does not exist.** The only Aviatron is a Vermont MRO shop acquired by Wencor in 2022. "Top Gun debrief" is a methodology written about in the aviation press. Your Target 2 was a garbled reference to **Navi AI**.
- **"Atlas" and "DebriefCFI" are one company.** debriefcfi.com 307-redirects to atlascfi.com. Entity: Aetherion Arc LLC. You were counting one competitor twice.
- **"Wingman" is a solo indie side project**, not a company. Personal Apple developer account, free, no revenue model, "not enough ratings" to display a score, and its release notes show it drifting into ground-school content. It is the only product that *names* the handoff use case — and it has no CFI account surface, so its "handoff brief" can only be built from student-side data. It names the problem it structurally cannot solve.

**What is genuinely more threatening than you thought:**

- **FlightSense is real, shipping, and ahead of you on two features you thought were open.** Deep public help docs (evidence of a real product, not a landing page), $15/seat/month, one Part 141 LOA, 750+ pilots. It ships debrief-quality scoring and CFI-performance analytics drawn from authored debriefs.
- **Navi has $6.7M**, United Airlines Ventures, a DoD SBIR, and Embry-Riddle/Purdue/UND/USAF Test Pilot School. It is enterprise-gated and hardware-dependent, and it is not in your lane — but it can move down-market.
- **ForeFlight is the asteroid.** They own CloudAhoy, shipped Debrief (Summer 2025), launched Scheduler *with training records* (July 2026), and launched an agentic AI engine with an MCP server, Claude support planned. They have the EFB, the tracklog, the logbook, and the billing relationship with nearly every US student pilot.

**What is less threatening than it looks:** FlightSense's August 2026 expansion into scheduling, dispatch, maintenance and invoicing is a *commitment*, and plausibly a strategic mistake. A 750-pilot company attacking Flight Schedule Pro on its home ground, in a segment where per-aircraft pricing caps accounts at $80–230/month, is spending every engineer-quarter somewhere other than the narrative slot. They may be abandoning your lane, not closing it.

**Two premises in your brief are factually wrong and would damage a pitch:** flight-school insurance is **softening**, not spiking (the hard market was 2019–2022). And the FAA SMS rule (14 CFR Part 5) **does not cover Part 141 or Part 91 flight schools**. Do not build a safety-mandate story on either. A third: the explicit postflight-critique mandate exists in Part 141 Appendix A (Recreational), **not** Appendix B (Private) — do not market it as a universal requirement.

**And the biggest change of all — to your own product.** You asked whether to build the Continuity Graph, the perception gap, and the Next-CFI Brief. Verified against source: **you already built them.** `lib/debrief-cards/discrepancy.ts` ships perception-gap detection with a `/compare` route. `/cfi/students/[id]/handoff` ships the handoff brief. `study_resource_views` ships open-tracking. `training_signals` already carries `instructor_id` on every row, so cross-instructor recurrence is a `COUNT(DISTINCT)` away. Your market read was 12 months stale in one direction — and your read of *your own product* was 12 months stale in the other.

---

## 3. COMPETITIVE MATRIX

LIVE / PLANNED / CONCEPT. ✅ Strong · 🟡 Partial · ❌ Missing · ? Unknown.
AfterFlight column verified from source code, not marketing.

| Capability | **AfterFlight** | FlightSense | Navi AI | Atlas/DebriefCFI | Wingman | ForeFlight+CloudAhoy | MasterPilot | FlytWERX | Aviatize |
|---|---|---|---|---|---|---|---|---|---|
| Voice debrief recording | ✅ LIVE | ✅ | 🟡 cockpit only | ✅ dictation | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cockpit audio recording | ❌ | ❌ | ✅ (cable) | 🟡 (cable) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Transcription | ✅ LIVE (+diarization, word timestamps) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI summary | ✅ LIVE | ✅ | ✅ | ✅ | ? claim | ❌ | ✅ | ❌ | ❌ |
| Student self-reflection | ✅ LIVE | 🟡 capture only, never compared | ❌ | 🟡 study side | ❌ | ❌ | ❌ | ❌ | ❌ |
| CFI assessment | ✅ LIVE (CFI-first enforced) | ✅ | 🟡 | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Self-vs-CFI discrepancy detection** | **✅ LIVE** | **❌** | ❌ | **❌ (holds both, never joins)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| ACS mapping | ✅ LIVE | ✅ predicted from summary | ✅ | ✅ | 🟡 | ❌ | ✅ | ✅ | ✅ |
| Maneuver scoring | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ 19 maneuvers | ✅ 21+ | ❌ |
| Telemetry | 🟡 FR24 track only | ❌ | ✅ avionics+ADS-B | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| What went well / needs work | ✅ LIVE | ✅ | ✅ | ✅ | ? | ❌ | ✅ | ❌ | ❌ |
| Action items | ✅ LIVE (+auto-resolve across lessons) | ✅ | ✅ | ✅ | ? | ❌ | ❌ | ❌ | ❌ |
| Next-flight focus | ✅ LIVE | ❌ | 🟡 | ✅ | ? claim | ❌ | ❌ | ❌ | ❌ |
| **Next-flight brief (synthesized)** | **✅ LIVE** | ❌ | ❌ | 🟡 shares a page | ? claim, no CFI data | ❌ | ❌ | ❌ | ❌ |
| Study recommendations tied to lesson | ✅ LIVE | 🟡 Amelia chat, no library | ✅ ACS-coded plan | ✅ + spaced repetition | 🟡 | ❌ | ❌ | ❌ | ❌ |
| **Resource open-tracking** | **✅ LIVE** (`study_resource_views`) | ❌ | ❌ | **✅ strongest feature** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Instructor handoff brief** | **✅ LIVE** | ❌ | ❌ | 🟡 artifact, not synthesis | 🟡 claim only | ❌ | ❌ | ❌ | 🟡 alerts on switch count |
| **Multi-CFI continuity (skill recurrence across instructors)** | **🟡 data model ready, not surfaced** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 counts bodies, not skills |
| Longitudinal training memory | ✅ LIVE | 🟡 15-log window | 🟡 flight-unit | ✅ | ❌ | ❌ | 🟡 | 🟡 | ✅ |
| Student progress history | ✅ LIVE | ✅ | ✅ | ✅ | 🟡 | ❌ | ✅ | ✅ | ✅ |
| Proficiency scoring | ✅ LIVE (FlightScore) | ✅ running avg | ✅ | ✅ readiness map | ❌ | ✅ | ✅ | ✅ | ✅ |
| Skill trends | ✅ LIVE | ✅ | ✅ | ✅ | 🟡 claim | 🟡 | ✅ | ✅ | ✅ |
| School dashboard | ✅ LIVE (`/admin/insights`) | ✅ | ✅ | ✅ | ❌ | 🟡 Scheduler | 🟡 | ❌ | ✅ |
| Scheduling | 🟡 reservations only | ✅ | ❌ | 🟡 SchedulePointe | ❌ | ✅ | ❌ | ❌ | ✅ |
| Dispatch | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Billing | 🟡 Stripe subs only | ✅ meter-based invoicing | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Part 141 records | ❌ | ✅ + LOA + FSDO export | 🟡 | ❌ | ❌ | 🟡 roadmap | ❌ | ❌ | ✅ |
| LMS / ground school | ❌ | 🟡 Amelia | 🟡 flashcards | ✅ | 🟡 drifting there | ❌ | ❌ | ❌ | 🟡 |
| Student mobile experience | 🟡 responsive web | ✅ iOS only | ✅ iOS, school-gated | ? | ✅ iOS+Android | ✅ | ✅ | ✅ | 🟡 |
| Instructor workflow | ✅ LIVE | ✅ | 🟡 criticized | ✅ | ❌ no CFI surface | ❌ | 🟡 | 🟡 | ✅ |
| **Audio recap / Debrief Replay** | **✅ LIVE** | **❌** | **❌** | **❌** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Explicit source attribution | ✅ LIVE (never fabricated) | ✅ Amelia cites FAA | ✅ | ✅ | ? | n/a | ❌ | ❌ | n/a |
| Consent / privacy workflow | 🟡 consent-gated capture, no retention policy | ? | ✅ institutional | ? | n/a | n/a | n/a | n/a | n/a |
| **Debrief quality scoring** | ❌ CONCEPT — **do not build** | **✅ SHIPPED** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CFI analytics from debrief content** | ❌ CONCEPT — **do not build** | **✅ SHIPPED** | ❌ | 🟡 hours, not quality | ❌ | ❌ | ❌ | ❌ | 🟡 |
| Student-owned portable record | ❌ CONCEPT | ❌ school-owned | ❌ school-gated | 🟡 **CFI**-owned | ❌ | 🟡 logbook | ❌ | ❌ | ❌ |
| Integrations | 🟡 FR24, Stripe, Deepgram | SSO+API (Enterprise) | Garmin | SchedulePointe | ❌ | MCP server, Claude planned | ForeFlight, Garmin, Dynon | Stratus, MSFS | many |
| Pricing | TBD | $15/seat/mo | undisclosed | $0–990/yr | Free | $130–390/yr | $239.99/yr | $19.99–199/yr | $29/aircraft/mo |
| Target ICP | TBD | 61+141, CFIs, students | universities, military | CFIs + students | students | all GA | pilots | sim + GA | 61+141 EASA |

**Sample-size caveat the council insists on:** FlightSense has 8 App Store ratings. Navi has 16. Atlas has no listing at all. None of these competitors has demonstrated real traction. Do not treat their feature lists as evidence of product-market fit.

---

## 4. DIRECT THREAT RANKING

1. **ForeFlight / CloudAhoy — the only existential threat.** Distribution to nearly every US student pilot, the tracklog, the logbook, the billing relationship, Debrief shipped, Scheduler with training records in early access, and an agentic MCP layer. They do not need to be better; they need only to be adequate and bundled. **Mitigating evidence the council weighed:** CloudAhoy's blog has been silent three years, Debrief explicitly does not claim AI, and the instructor page still has no syllabus or grading. Two reviewers judged the "12-month window" an over-claim and put the realistic horizon at 24–36 months. Treat it as 18.
2. **FlightSense — the closest direct competitor, and possibly self-neutralizing.** Same capture story, same "voice debrief becomes a training record" pitch, $15/seat, real docs, real records, one LOA. Ships two things you should now abandon. But its August 2026 sprint into full ops points its roadmap away from the narrative slot for the next several quarters.
3. **Atlas / DebriefCFI — the strategic twin, and one feature from your wedge.** Student-pays/CFI-free, ACS-graded signed records, and the best study-engagement telemetry in the market. It holds both assessment sides and has never joined them. Zero traction and an unwinnable SEO name — but the closest product thesis to yours by a wide margin.
4. **Navi AI — capital and logos, wrong altitude.** $6.7M, United Airlines Ventures, DoD, ERAU/Purdue/UND/USAF. Enterprise-gated, cable-dependent, telemetry-substrate. Dangerous only if it moves down-market, which its hardware dependency makes slow.
5. **Aviatize — quietly relevant.** $29/aircraft/month, already alerts on instructor-switching, already markets "replaces the training folder on a CFI's desk." Counts bodies, not skills — but it is the vendor most likely to add your headline cheaply.
6. **MasterPilot / FlytWERX / Sporty's / Gleim — price anchors and adjacent lanes**, not threats. FlytWERX sets a $19.99/yr floor for telemetry scoring; Sporty's $299 lifetime and Gleim undercut any ground-school ambition.
7. **The four ops incumbents (FSP, Flight Circle, Talon, Coflyt) — at absolute zero on AI and not moving.** FSP spent the window on M&A and fleet financing. Flight Circle at $10/aircraft has no margin to fund inference. Notably, Embry-Riddle is a Talon customer *and* a Navi equity stakeholder — it went outside its incumbent rather than wait.

---

## 5. COMMODITY vs WHITE SPACE

| **COMMODITIZED — table stakes, never a differentiator again** | **OPEN / UNDER-SERVED — verified unclaimed** |
|---|---|
| Record the debrief | Skill recurrence **across different instructors** (nobody; Aviatize counts switches, not skills) |
| Transcribe it | Student-vs-CFI **perception gap detection** (FlightSense and Atlas both hold the data and never join it) |
| Summarize it | A **synthesized** "what should the next CFI know" brief (Wingman names it without CFI data; Atlas shares a page) |
| Identify strengths/weaknesses | **Audio output** — every competitor treats audio as input only |
| Generate action items | Compressing CFI documentation minutes as the *sold* benefit |
| Map to ACS | The narrative slot itself: debrief content is required by nobody and owned by nobody |
| Recommend the next lesson | Being the reference schema if FAA-2024-2531 produces a rule |
| Track proficiency | |
| **Debrief-quality scoring — SHIPPED BY FLIGHTSENSE** | |
| **CFI analytics from debrief content — SHIPPED BY FLIGHTSENSE** | |

Answer to your central question, stated plainly: **"Continuity" is a nicer word for functionality competitors already claim. "The same weakness with three different instructors" is a mechanism none of them can compute.** The category is not open. The mechanism is.

---

## 6. THE WHITE SPACE — RANKED

Scores 1–10: Market importance / Differentiation / Buildability / Defensibility / Willingness to pay.

**1. Cross-instructor recurrence ("the Continuity Graph") — 8 / 9 / 10 / 6 / 7**
A `COUNT(DISTINCT instructor_id)` inside `computeRecurringThemes()`. Converts a generic recurring theme into the one sentence no competitor can say: *"Slow flight has been flagged in 4 lessons across 3 CFIs — this is the student, not the instructor."* Defensibility only 6: copyable in a sprint once named; the moat is being first to own the phrase. **Cold-start warning the council flagged: it emits nothing until a student has flown several lessons with ≥2 CFIs. It is empty on day one and empty in every cold demo.** Seed it or demo it on loaded data.

**2. Synthesized Next-CFI Brief — 9 / 9 / 10 / 7 / 8**
Already live. Market 9 because the handoff artifact today is *a conversation* — a CFI on Pilots of America: *"Every instructor that has left our flight school sat down with the new instructor... and talked about where they left off."* Nothing is written down. WTP 8 — the only feature with a dollar figure attached (~5 repeat hours typical, 18 worst case, ~$1,250–1,750 per handoff). **Sell "fewer repeat hours," never "zero":** the repeat hours are driven by endorsement liability, not lost information, and 141.77 caps transfer credit by regulation. A brief shortens the sign-off ramp; it cannot remove it.

**3. Student-vs-CFI perception gap — 7 / 10 / 10 / 5 / 6**
Differentiation 10 — two competitors hold both data sides and neither connects them. Defensibility 5 for exactly that reason: one feature away for both. Market 7 because no student has ever asked for it. A demo-winner, not a search term.

**4. Audio Debrief Replay — 6 / 10 / 10 / 4 / 5**
Verified unclaimed across the entire scan, already shipped, and the only feature that *removes* CFI minutes rather than adding them. Defensibility 4 (TTS is a vendor call). Differentiation without demand: the thing that makes a demo memorable, wrong as the headline.

**5. Portable student-owned record — 4 / 7 / 5 / 3 / 2**
The most confident low score in the set. Thirteen documented cases — MyFlightbook, HealthVault, Google Health, Ciitizen, Blockcerts, Credly at **$0.28 per badge-holder** — and **no individual has ever paid meaningfully for custody of their own record.** Parchment's $835M came from 15,000 *institutions*. Worse, it inverts the consent architecture: a student-portable recording of a named CFI's teaching is precisely what resistant CFIs object to. **Ship export as a free trust feature. Never as a revenue line or a positioning pillar.**

**Dead — do not build: debrief-quality scoring (3/1/6/2/3) and CFI development analytics (3/1/5/2/4).** Both shipped by FlightSense. The second is strategically worse than redundant: it makes the CFI the subject of measurement in the exact place adoption dies.

---

## 7. THE WEDGE

> **AfterFlight should own: the conversation half of the training record — and specifically, being the only system that can tell a school when the same weakness has survived two different instructors.**

Everyone else is digitizing the *flight*: telemetry, maneuver deviation, ACS tolerances, tracklogs. That substrate is contested by ForeFlight, CloudAhoy, Navi, MasterPilot and FlytWERX, three of whom will out-spend you and one of whom sets a $19.99/year floor.

Nobody is digitizing the *conversation* — what the instructor actually said, what the student actually heard, and the distance between them. It is required by no regulation, held by no system, and owned by no vendor. The legally mandated record is a time-and-signature ledger, not a competency record; maneuver grades, debrief notes and next-lesson plans are required by nobody and stored by nobody. That is your slot, and it is unowned because nobody has paid for it — not because nobody noticed.

Cross-instructor recurrence is the *proof* of that slot. It is the one analytic that requires the conversation record and cannot be derived from telemetry, and it reframes a school's most uncomfortable question — *is this student slow, or is this instructor weak?* — into something answerable with evidence. It is also the finding a school owner cannot get any other way, which is what makes it worth a meeting.

And the delivery mechanism is the part your competitors structurally reject: the CFI speaks a debrief they were going to speak anyway, and everything downstream costs them zero keystrokes. FlightSense makes the CFI review AI-predicted ACS grades. Atlas makes them sign. Every ops platform makes them type. **You are the only product positioned to answer the single unsolicited pain quote in the entire research corpus** — a CFI, unprompted, inside a review of a *scheduling* product: *"It takes me a long time to do the documentation of a flight."*

---

## 8. WHAT AFTERFLIGHT SHOULD STOP SAYING

- **"AI flight debrief."** Commodity. The primitive is a published 2024 peer-reviewed paper. Category (A) is dead.
- **"Too much of the debrief gets lost."** True, unfalsifiable, and it describes a problem the sufferer has never once articulated as record-loss. No pilot or CFI anywhere was found blaming turnover for lost records.
- **"The continuity layer for flight training."** You would be the fourth vendor using the word.
- **"One debrief. Everything you need for the next flight."** Describes what FlightSense, Atlas and Navi all claim.
- **"We score debrief quality" / "instructor development analytics."** FlightSense ships both. Never say these again.
- **"Structured training records"** as a differentiator. The Part 141 modernization docket is a clock, not a moat.
- **"Training memory" / "training intelligence layer."** Unfalsifiable category costumes. Both are what a founder says when the feature list has no center.
- **Anything implying a Part 141 postflight-critique mandate, an SMS requirement, or hardening insurance.** All three are factually wrong.

---

## 9. NEW POSITIONING

**Category:** Training continuity intelligence — *the conversation record for flight training.* (Lead with the mechanism, not the category noun.)

**One-sentence pitch:** AfterFlight captures the debrief your instructor already gives and turns it into the one thing no scheduling system can produce — a record of what was actually said, what the student actually heard, and what keeps coming back no matter who is teaching.

**Homepage headline:** *The same mistake, three instructors, nobody noticed.*

**Homepage subhead:** AfterFlight listens to the debrief you already give, and tells you when a weakness has outlived the instructor who found it.

**School pitch:** Your instructors turn over every 14 months. Your students don't. AfterFlight is the only system that can tell you when a problem has survived two CFIs — which is the difference between a student who needs more time and a curriculum that isn't working. It costs your instructors nothing: they talk for ninety seconds, and the lesson record writes itself.

**CFI pitch:** Stop writing lesson notes. Talk through the debrief the way you always do; AfterFlight writes the record, the next-lesson plan, and the handoff brief. When you leave, the student doesn't start over — and the next instructor knows what you knew.

**Student pitch:** You'll forget most of this debrief by tomorrow. AfterFlight gives it back to you on the drive home — in your instructor's words, with what to work on next, and it remembers what you're still chasing three lessons from now.

---

## 10. PRODUCT ROADMAP CHANGES

**KEEP** — voice debrief capture; Claude structuring; instructor attribution (never fabricated); Next-Lesson Brief; handoff brief; action-item auto-resolve; training signals + taxonomy; study references + open-tracking; Debrief Replay audio; FlightScore; multi-org membership.

**DOUBLE DOWN**
1. **Cross-instructor recurrence.** Add `COUNT(DISTINCT instructor_id)` to `computeRecurringThemes()` and surface the sentence. One day of work. Treat the *headline* as the product, not the query. Seed demo data so it is never empty on arrival.
2. **Speed of capture.** Get the CFI's step to voice-only, under 90 seconds, one input, no second screen. The operator's threshold was explicit: *"If it's three minutes and two screens it dies in six weeks."*
3. **The perception gap as the demo moment.** It is already built and it is the most surprising thing you can show in sixty seconds.
4. **Minutes saved as the measured, marketed metric.** Stopwatch-defensible against $45–55/hr CFI wages.

**ADD**
5. **A consent and retention architecture** — enrollment-form consent for students, employment acknowledgment for CFIs, a hard audio retention limit (90 days, text thereafter), school-controlled deletion. Your operator advisor named this as a condition, not a nicety. Get an opinion of counsel on reasonable expectation of privacy in a cockpit before scaling; the dossier found *no case law on point*, which is a gap, not a green light.
6. **A free solo/self-debrief tier** (see §11 — this is the entry move).
7. **Export** — free, unpriced, as a trust feature.

**REMOVE**
8. **CFI-first sequencing as a hard gate.** Pedagogically correct, operationally a tax. Make it asynchronous or voice-only.
9. Any CFI review-and-approve gate on AI output. That mechanism is how every syllabus-adoption effort in the research died.

**DO NOT BUILD** — scheduling, dispatch, billing, maintenance, Part 141 recordkeeping, generic LMS/ground school, telemetry and maneuver analysis. All seven, categorically. Each converts a two-week sales cycle into a six-month rip-and-replace, raises the buyer from CFI to owner, and makes you comparable on features to vendors with more money. FlightSense went full-ops in August 2026 — **let them.** The strategic cost is not the engineering time; it is that your one repeatable sentence stops being repeatable.

---

## 11. ICP DECISION

**Primary ICP: the independent Part 61 flight school with 4–12 CFIs where students demonstrably fly with more than one instructor — where the school signs and the student pays.**

Why this and not the alternatives:

- **The school signs but does not fund.** School-budget ACV is $1,200–2,400/yr against a ~$400/month total software line; 3,500 schools × $1,800 is $6.3M at an impossible 100% penetration. The school is not the wallet. But it *is* the consent architecture — it employs the CFI and enrolls the student, so consent becomes an enrollment and employment document rather than a student unilaterally recording a third party's employee across twelve all-party-consent states. Navi records cockpit audio in production across multiple states with no visible legal incident precisely because its customer is the institution.
- **The student pays.** 75,000–145,000 proven payers already spending $600–1,100/yr out of pocket, against a $17,000 PPL where materials are ~1.5% of cost. Price at **$15–20/month, free for CFIs.** Free-for-CFI is not generosity: the CFI is the adoption veto and the routing agent (*"All of my new students will be using GP"*), and their 12–24 month tenure makes them a terrible subscription base and an excellent distribution channel.
- **Not individual students direct.** Legally the worst configuration for *dual* instruction — but see the solo exception below.
- **Not CFIs as payers.** $55–65k income, 12–24 month career transit. You would rebuild the book every 18 months.
- **Not universities, academies, or Part 141 at first.** Navi owns that beachhead with $6.7M and ERAU/Purdue/UND. Long sales cycles, committee buying, and you would be the third vendor in the room.
- **Not large Part 61 academies.** They have standardization programs — which the research shows is the *substitute* for your product, not a complement.

**The prospecting list you can build tomorrow.** Three filters, all mechanical:
1. **AOPA Flight Training Experience Award** schools — the qualification threshold is 10+ student reviews, which self-selects for schools that measure student experience and can be reached. Public list.
2. Cross-filter to **staff pages showing 4–12 named CFIs** (scrapeable) and **no in-house LMS**.
3. Prefer **one-party-consent states** for the first cohort to remove the legal variable while you get counsel's opinion.

Then two channels nobody in your brief named: **NAFI and SAFE** — CloudAhoy discounts 33% there and VectoredOps waives its instructor portal for members, so there is an established norm of vendor concessions to a pre-aggregated CFI list. And **accelerated / 10-day programs**, where handoffs are dense, compressed, and the cost of discontinuity is visible within a single week rather than a year.

---

## 12. FIVE CUSTOMER DISCOVERY QUESTIONS
Designed to **falsify** the continuity thesis, not to confirm it. Ask CFIs and chief instructors, not students.

1. **"Walk me through the last time a student was handed to you mid-training. What did you actually do in the first lesson, and how many hours passed before you'd sign an endorsement?"**
   *Falsifies if:* the answer is "I fly with them regardless of what I've read." That is the endorsement-liability mechanism, and it means no record shortens the ramp. Listen for whether they mention wanting information at all.
2. **"When an instructor left, what specifically got lost — and can you name a student where you can point to the cost?"**
   *Falsifies if:* they cannot name one, or the answer is "nothing, we have a syllabus." One CFI in the research said handoffs were seamless *because the school kept solid records*.
3. **"Show me where you wrote down what happened in your last three debriefs."**
   *Falsifies if:* they show you a complete, adequate artifact — or if they show you nothing and are entirely untroubled by it. The second is the more dangerous answer.
4. **"If I told you a student's flare timing had been flagged in four lessons across three different instructors, what would you do differently tomorrow?"**
   *Falsifies if:* the answer is "nothing" or "I already knew that." This is the wedge; if it produces no action, the wedge is a party trick.
5. **"Your last student debrief — how long was it, and how much of it did you write up afterward? What would you have done with those minutes?"**
   *Falsifies if:* the write-up time is already near zero. Then "minutes saved" is worth nothing and the whole compression pitch collapses.

---

## 13. KILL CRITERIA — 60 TO 90 DAYS
Pre-register these **before** running the sprint, so the result cannot be reinterpreted afterward.

**Kill if:**
1. **Fewer than 8 of 20** CFIs asked question 4 say the cross-instructor finding would change what they do tomorrow.
2. **Fewer than 6 of 20** CFIs, given the product free, record a debrief on **more than 60% of their flights** in week 4. Habit at week 4 is the entire business; adoption dies at CFI level in every documented case.
3. Median CFI capture time **exceeds 3 minutes** or requires more than one screen, and cannot be engineered below 2 minutes.
4. **Fewer than 25 of 200** students hitting a $15–20/month paywall complete a card authorization. Below ~12% you are fighting a price memory anchored at free.
5. **Zero of the first 10** schools will sign a consent architecture covering CFI recording, or **more than 30%** of CFIs in a signed school opt out.
6. You cannot produce **one school owner** who says the cross-instructor finding is worth a monthly fee *after seeing it on their own data.*
7. ForeFlight ships conversational/generative debrief with continuity. That is not a kill on its own — but it converts the plan from "build a business" to "sell the asset," immediately.

**Do NOT kill on:** absence of organic demand in forums. That evidence rests on Pilots of America alone (Reddit was unreachable), a forum skewing old, experienced and aircraft-owning — structurally the wrong population to sample for student-pilot demand.

---

## 14. THE RED-TEAM CASE
*(The strongest argument for shutting down, stated at full strength, then audited.)*

You are late to your own market and did not know it. You called debrief-quality scoring and CFI analytics unbuilt white space; FlightSense ships both today. Every remaining item on your list is, by the dossier's own words, "one feature away" for two competitors. Your continuity thesis is misdiagnosed: the repeat hours after a CFI switch are caused by endorsement liability, not lost information, and no brief you generate removes a new instructor's need to watch the student fly — 141.77 caps transfer credit by regulation regardless. Nobody is asking for this: zero organic posts request AI debrief, and a *free* CFI debrief app in June 2026 drew *"Why not just put notes on a knee board?"* The buyer cannot pay — $400/month total software budget, 5–15% margins, vendors in your own category publicly telling small schools not to buy. Your best user exits to the airlines in 12–24 months. ForeFlight owns the EFB, the tracklog, the logbook, the billing relationship and now an agentic AI engine, and AI debrief is their obvious next adjacency. And you are recording cockpit audio in a legal vacuum, building a discoverable archive with fewer protections than a certified CVR. Debriefing is a feature. The primitive is a published paper. Transcription is commodity. **You built all of it before you found out whether anyone wanted any of it, and now the working code is the only argument left that they do.**

**The audit — four of five reviewers found this the best-written and least sound response.**
- *Sound and conceded:* FlightSense ships debrief-quality scoring and CFI analytics (kill both). Zero organic demand is real and unresolved. Recording is a genuine liability surface with no case law on point.
- *False:* "Aviatize already ships your continuity thesis." Aviatize counts instructor *switches*; the wedge is skill *recurrence across* instructors. Different data model, different claim.
- *Over-claimed:* "ForeFlight closes the window in twelve months" is an inference, and the confirmed evidence cuts the other way — a three-year-silent CloudAhoy blog, a Debrief product that explicitly does not claim AI, and an instructor page still lacking syllabus and grading. That company does not ship conversational debrief in twelve months.
- *Refuted:* "The buyer cannot pay" is true of schools and false of the market. Two advisors independently landed on the student as the payer against 75,000–145,000 proven payers.
- *Fallacious:* the closing line is a genetic fallacy. How the software came to exist has no bearing on whether the wedge is real.

---

## 15. FINAL FOUNDER RECOMMENDATION

**If this were my money and the next six months of my life, I would spend the next two weeks buying information instead of writing features — and I would not touch the homepage or the roadmap until that information is in.**

Concretely, in this order:

**Week 1.** Ship the `COUNT(DISTINCT instructor_id)` change and the sentence it produces — one day. Seed a demo account with loaded multi-instructor history so the finding is never empty in a demo. Then open a browser and read the two JS-rendered FlightSense FAQ answers — *"What happens when an instructor leaves?"* and *"Who owns our data?"* The research flagged these as the highest-value unknowns in the entire competitive landscape and they are one page load away; no advisor thought to just go look.

**Week 2.** Twenty CFI conversations from the NAFI/SAFE and AOPA-award lists, asking the five falsifying questions in §12 — especially question 4, on the cross-instructor finding, and question 5, on write-up minutes. Put a $15–20/month student paywall on a landing page and drive 200 students to it; count card authorizations, not signups. Do not build anything else during these two weeks.

**In parallel, ship the solo tier free.** AfterFlight already supports pilots flying without an instructor. A solo pilot recording himself has no second party — no all-party-consent exposure, no CFI veto, no school contract, no legal opinion required to start. It is the only configuration that can ship free today, accumulate the longitudinal record the Continuity Graph needs to escape its cold start, and arrive at a school *already loaded with a student's history*. Your task list has "Self-serve solo student signup" sitting at in_progress; the council independently identified it as the entry move. Finish it first. The consent problem and the willingness-to-pay problem are separable **in time, not in one design**: free solo wedge → paid when a CFI attaches.

**And then be honest about the ceiling.** The realistic outcome here is a $2–5M ARR business, not a venture one. For a solo founder with a built product and low burn, that is a good life and a real company — but only if you stop building toward a school's checkbook that the operator on this council told you plainly he would not open. There is **no moat available from data or habit** in this market; CFIs and students both churn faster than any switching cost can compound. Your only durable positions are speed, the phrase nobody else has claimed, and one option nobody in your brief considered: the FAA Part 141 modernization docket closed 11 May 2026 with the industry formally asking the regulator for standardized, aggregable, ACS-anchored competency data and a national crosswalk API. Your `training_signals` schema — instructor-attributed, ACS-anchored, longitudinal — is a working reference implementation of the thing the industry just asked for and nobody has built. Every advisor treated that docket as a clock running against you. It is also the only buyer in the entire research with no price sensitivity.

If the two-week sprint hits the kill criteria in §13, stop — and you will have spent two weeks to learn it instead of six months. If it doesn't, you will have the one thing this council could not give you: evidence that somebody, somewhere, wants this.
