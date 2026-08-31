# AFTERFLIGHT — STRATEGIC RESET COUNCIL VERDICT
31 Aug 2026 · 3 live research agents · 6 advisors · 3 adversarial reviewers

---

## 1. VERDICT: **CONTINUE, BUT PIVOT**

Continue. But not into the pivot in the brief.

The brief proposes: student pays $19.99/month, AI Trainer is the core, CFIs distribute for $25 a head. **Three of those four are wrong, and the evidence kills them without much argument.** The monthly subscription dies in weather months and against a 24%-annual-renewal category. The $25 bounty exceeds the median customer's entire Year-1 lifetime value. The CFI channel yields roughly 108 subscribers a year against a $15-25k cost to reach it. And "AI-generated post-flight feedback" is the one category in this market with a documented commercial zero: MasterPilot 3 ratings, Aviate AI 11, Redbird Pro 6 after five years with the best distribution in general aviation.

What survives is narrower and better. Every advisor who looked at demand independently arrived at the same place: **the student does not want a coach, they want to know whether they are behind and what is standing between them and the next milestone.** The council's student put it plainly -- *"I've spent $12,000 and I genuinely do not know if I'm 60% done or 40% done. I lie awake about this."* -- and then said she would pay $20 a month, immediately, for four things standing between her and solo. Nobody sells that. FlightSense's own "track checkride readiness" is a pricing bullet with no feature behind it; they named the demand and did not build it.

The red team's shutdown case was the strongest-written response in the packet and, audited claim by claim, five of its eight arguments collapsed. What survived is real and must be honored: the economics, the channel size, the referral, and the fact that post-flight AI reflection does not sell. **Those findings kill the business model in the brief. They do not touch the two things the buyer said she would pay for today, which nobody currently sells.** That is the distinction the verdict turns on.

So: keep building, stop selling a subscription, stop selling a coach, and stop building for schools. Ship one object in two weeks and let one number decide the rest.

---

## 2. WHAT CHANGED

FlightSense is a stronger school platform than assumed -- but the more consequential discoveries are three corrections to the 30 Aug council, all of which narrow the ground AfterFlight thought it held:

- **They ship portable student records.** An 8-character ID, not email: *"If you transfer to a different school, your debrief history, grades, and progress follow your FlightSense ID."* The "student-owned record" white space is closed.
- **They actively sell the handoff as their lead wedge** -- *"makes handoffs about ten times easier, and it's often the first problem they feel us solve."*
- **They have a free tier.** The prior finding was wrong.

But the student-side scan cut the other way and is the reason this is not a STOP:

- **Amelia does not teach.** Their own doc: *"Aware of your current-session flight context unless you explicitly attach it."* It is Q&A over FAA material with a manual per-thread attachment.
- **Zero retrieval practice anywhere.** All 44 help articles grepped: no quiz, flashcard, spaced repetition, question bank. **The student never answers a question inside the product.**
- **The student surface is read-only**, stated four separate ways.
- **"Track checkride readiness" has no shipped feature.**

And the market-structure finding that outranks all of it: **every competitor either holds real flight data and does nothing pedagogical with it (FlightSense, Atlas, Navi), or does real pedagogy on data that is not the student's flying (PilotTrack, Sporty's, check-ride.ai, Gleim). Nobody crosses.**

---

## 3. IS THE SCHOOL MARKET LOST? **Yes -- as the primary buyer.**

Not because FlightSense is unbeatable, but because the arithmetic never worked. A school's entire software budget is ~$400/month and card processing dwarfs it. FlightSense sells the whole operating system at $15/seat and tells schools to pass the cost through. You would be a second line item with no dispatch, no billing, no Part 141 records.

Stop selling to schools. Do not delete the school surfaces -- freeze them (see §9).

---

## 4. IS STUDENT-FIRST THE BETTER WEDGE? **Yes, with one correction.**

Payer: student. CFI: free. School: irrelevant, not "optional facilitator."

The correction: **the CFI is not the channel.** 12,000 reachable CFIs x 3% signup x 30% active x 4 students x 25% conversion = ~108 subscribers a year. Negative margin against any serious outreach cost. Five vendors independently converged on free-tool-plus-dashboard rather than cash because a CFI does the arithmetic instantly -- $375/yr is a rounding error against $50-80/hr. ForeFlight swapped a discount for a referral program in Dec 2025 and got anger.

Give CFIs the product free, forever, with no student cap, because it makes the student's data better and costs nothing. Do not model them as acquisition.

---

## 5. AI TRAINER VERDICT: **No as the core. Yes as the mechanism.**

"Debrief -> Teach -> Quiz -> Next Flight" is a feature bundle with one real thing in it. The *Teach* step is the weakest: generated prose is the most copyable artifact in the stack, nobody has shown students want post-flight micro-lessons, and AI-personalization apps retain *worse* (21.1% vs 30.7% annual).

Invert it. **The core is graded voice recall of the student's own last flight** -- three questions, answered out loud, 18-24h after the debrief. Teaching becomes the *response to a wrong answer*, not the product. That is also correct learning design (reflection before feedback) and it makes the lesson cheap instead of load-bearing.

**One correction from the buyer: never show a score.** *"Show me a score and it becomes another thing I'm failing at."* Grade internally to drive the record; show the student a conversation, not a mark.

---

## 6. COMPETITIVE ADVANTAGE -- stated exactly

**AfterFlight can tell a student what their instructors have actually flagged, repeatedly, across a change of instructor -- in their instructors' own words, searchable, and spoken back to them -- and turn that into a rehearsal the night before the next lesson. FlightSense holds the same data and exposes it read-only with no practice of any kind; PilotTrack does the practice but on quiz history and logbook hours, not on what a CFI said.**

That is the whole claim. Everything else is machinery.

---

## 7. THE FLIGHTSENSE TEST

*"FlightSense shows me my instructor's grades. AfterFlight tells me what my instructors keep flagging, and gets me ready for Tuesday."*

**Medium-strong, and honestly weaker in the case that matters most.** A school-seated student pays $0 and has unlimited Amelia. Their CFI already answers "am I ready" for free, in person, with authority AfterFlight cannot claim.

Where it is genuinely strong: the **guest-with-no-subscription** state (FlightSense's own underserved segment, invisible from outside), and the **independent Part 61 student with no school platform at all.** That is the beachhead and it is smaller than the brief assumes.

---

## 8. CFI ADOPTION TEST -- the minimum viable workflow

Assume a tired, underpaid CFI who does not want another app.

**Tap record. Talk for 90 seconds. Tap stop. Leave.** No account required for the lightweight mode. No grid, no approval step, no signature. Never a paid CFI tier. Never anything that scores instructors -- the guard is already in the test suite; keep it.

What the CFI gets, unpaid-time-back rather than cash: their students' unresolved items and next-lesson focus, pre-populated. That is the only currency that has ever moved this audience.

---

## 9. PRODUCT ROADMAP

**KEEP** -- voice debrief capture; Claude structuring; instructor attribution; `training_signals` + cross-instructor recurrence; the perception gap (reframed, see below); Debrief Replay audio; consent + retention; the no-instructor-scorecard guard.

**DOUBLE DOWN**
1. **The searchable record of what instructors said.** ~90% built. Worth $20 standalone per the actual buyer. Absent from every advisor's roadmap. *"I forget half of every debrief within a day. Between two instructors I've had things explained twice, differently."*
2. **Audio-first delivery, in the right slot** -- the drive home and the night before the next lesson. Not a headline feature; a delivery format that converts because nobody else ships it.
3. **Cross-instructor recurrence** -- already built, still unclaimed by anyone.

**ADD**
4. **The Flight-Grounded Voice Check** -- 3 questions from the last debrief, answered by voice, written back to `training_signals`. ~2 weeks. This is the test.
5. **"What's standing between you and solo"** -- sourced, attributed, **no forward verdict** (see §14).
6. **Capture the next flight date at debrief close.** The single most important field not currently collected; it is what makes a dated rehearsal plan possible.
7. **Pause.** *"If I don't fly for three weeks and get billed anyway, I cancel."*

**REMOVE / STOP SELLING** -- FlightScore (a single number contradicts "what's blocking you" and reads as a scorecard); study-reference open-tracking; the handoff brief *as positioning* (keep the feature); the "student-owned portable record" claim; the 3-free-flights entitlement (wrong unit).

**FREEZE, DO NOT DELETE** -- school/admin views, multi-org, insights, school Stripe plans. Deleting costs a week and buys nothing; the tests and access boundaries are load-bearing. Stop maintaining, stop selling, leave it compiling.

**DO NOT BUILD** -- the generated micro-lesson as a product; a spaced-repetition scheduler; a checkride readiness verdict *yet*; the landscape training workspace; the 12-screen prototype; any new UI shell; scheduling/dispatch/billing/141; Meta/multimodal.

---

## 10. PROTOTYPE RECOMMENDATION

**Do not build the 12-screen prototype.** Build one object.

**The Flight-Grounded Voice Check.** Fires 18-24h after a debrief. Three questions generated from that debrief's needs-work items and next-lesson focus -- e.g. *"You were high and fast on the third landing. What's the first thing you fix?"* Student answers by voice. Response is scored internally and written back to `training_signals` so it feeds recurrence. Student sees a short spoken reply, not a mark.

Reuses Deepgram STT, Claude, the radio module's AI judge and scoring harness, ACS mapping, recurrence and TTS. **Roughly two weeks.**

Instrument exactly one thing: **week-4 repeat rate.**

---

## 11. UI RECOMMENDATION

**Mobile-first, audio-first. No landscape workspace.** The buyer, verbatim: *"I have never once wished for a landscape training workspace."*

Phone: capture, spoken recap, voice check, what's-blocking-you, search. Desktop: the searchable record, because that is the one thing people genuinely use a keyboard for. Nothing else.

---

## 12. PRICING RECOMMENDATION

**$49 "Solo Prep" -- 8 weeks, one payment, no auto-renew.** Then **$79 "Checkride Prep"** as the second purchase.

Not $19.99/month: it is 2x the education category median, it bills in months the student does not fly, and the category's own data says these apps retain best on plans matched to the goal's duration (education has the *highest weekly* renewal of any category at 58%).

Not $149 through-checkride either: that asks a 28-hour student to prepay for a checkride the base rate says they have a ~20% chance of reaching. **Solo is the acquisition SKU because solo is inside the window where 80% of the churn happens.** Checkride is the upsell to the survivors.

Monthly, if offered at all, at $29 -- deliberately the worse option -- with pause.

---

## 13. REFERRAL MODEL: **Reject the cash. Both amounts.**

$25 is 51% of Apple year-1 net LTV and roughly 110% of the median education subscriber's entire Year-1 realized value. The $50 founding rate is 102% of net. Both are negative margin on a customer whose median life is 3.49 collected months.

Replace with **free CFI access forever + account credit, never cash.** That is ForeFlight's exact design, and it also dissolves the one documented ethics concern -- which, note, runs to the CFI's **employer**, not the student. King Schools runs the largest free CFI program in GA on $0 cash.

---

## 14. FRAUD CONTROLS -- and a bigger risk nobody named

The proposed controls are sound and mostly moot once the payout is credit rather than cash. Keep: verified identity, new-customers-only, delayed qualification, refund/chargeback voiding, permanent attribution, no self-referral, duplicate detection, caps.

**The larger exposure is not fraud. It is the solo verdict.**

A CFI's signature is legally required to solo a student. If AfterFlight tells a student *"you're ready to solo"* and their instructor disagrees, you have (a) put yourself against the person whose free distribution you depend on, and (b) created a document a plaintiff would enjoy if that student prangs a solo.

**Never issue a forward verdict.** Ship the retrospective, sourced version: *"Here are the four things your instructors have flagged more than once and not cleared."* Attributed, quoted, no prediction. That is also exactly what the buyer asked for -- and it is strictly safer and strictly more differentiated than a percentage.

---

## 15. FINANCIAL MODEL (rebuilt on real retention)

At **$49 Solo Prep**, ~35% take the $79 Checkride Prep -> **~$77 revenue per acquired student.** Net of Stripe ~2.9% + $0.30: **~$74.** AI COGS over an 8-week engagement: ~$3-6. **Gross margin ~90%.**

| Paying students/yr | Revenue | Net contribution (~90% GM) | Read |
|---|---|---|---|
| 50 | $3,850 | ~$3,400 | Signal only |
| 100 | $7,700 | ~$6,900 | Validation |
| 500 | $38,500 | ~$34,600 | Side income |
| 1,000 | $77,000 | ~$69,000 | Meaningful |
| 2,500 | $192,500 | ~$173,000 | Sustainable solo-founder |
| 5,000 | $385,000 | ~$346,000 | Real small business |

**Context: ~59,000 new US student pilot certificates were issued in 2025.** 2,500 paying = ~4% of the annual cohort. 5,000 = ~8.5%. **$1M ARR would require ~13,000 -- 22% of every new student pilot in America. Venture scale is arithmetically impossible in this ICP.**

For comparison, the monthly model: realistic LTV is **3.49 collected months = $69.77 gross, $48.84 net through Apple.** The term price collects more per customer with none of the month-2 mortality.

---

## 16. CFI CHANNEL MODEL

| Active CFIs | Students each | Converted | Revenue @ $77 |
|---|---|---|---|
| 50 | 3 | 38 | $2,900 |
| 100 | 3 | 75 | $5,800 |
| 250 | 3 | 188 | $14,500 |
| 500 | 3 | 375 | $28,900 |
| 1,000 | 3 | 750 | $57,800 |

Assumes 25% trial-to-paid. **To reach 1,000 active CFIs you must enroll ~3,300 and reach ~10,000+ -- essentially the entire cheaply-reachable population -- to produce $58k.** The channel is real but small and slow. Treat it as a data and quality flywheel, never as the growth engine.

---

## 17. LTV / CAC

Term pricing has no "lifetime" in the subscription sense; it has a purchase and a possible second purchase.

| | Revenue | Max CAC @ 3:1 |
|---|---|---|
| Solo Prep only | $49 | $16 |
| + Checkride Prep (35%) | $77 | $26 |
| + a second rating later (~10%) | $85 | $28 |

**Any channel costing more than ~$25 per acquired student does not work.** That eliminates paid social ($150-300), the FAA postal file ($300-600), and the $25 cash referral (which alone equals the entire CAC ceiling). It leaves organic search, the free voice surface, and CFI word-of-mouth.

---

## 18. FIRST 90 DAYS

**Weeks 1-2.** Build the Flight-Grounded Voice Check. Nothing else. Buy a $150 Semrush/Ahrefs seat on day one and get real volume for "am I ready to solo," "chair flying," "how many hours to solo," "power off 180" -- none of it is publicly retrievable and you are guessing without it.

**Weeks 3-6.** Put it in front of 40 students via existing CFI relationships and the AOPA Flight Training Experience distinguished list (public, ~4,200 reviews, pre-qualified for caring about student experience). Free. No pricing yet. Measure open rate, completion, and week-4 repeat.

**Weeks 7-10.** If week-4 repeat clears 25%, ship "what's standing between you and solo" (retrospective, sourced) and put $49 Solo Prep behind it. Measure card authorizations, not signups.

**Weeks 11-13.** In parallel, one free public no-login voice scenario -- *"talk me through a power-off 180"* -- wired to the existing radio scoring, as an SEO/acquisition surface. Instrument whether search volume exists at all.

Not in the 90 days: schools, the CFI referral program, the Meta project, the micro-lesson generator, any new UI shell.

---

## 19. THE 20 FOUNDING CFI TEST -- critique

**It is structured to succeed cosmetically.** 20 x 5 = 100 students is a number chosen for a slide, not from a base rate. And $50/student means you pay for referrals you would have got anyway, then declare the channel proven.

Rebuilt: **recruit 40, pay $0, hard stop at 90 days.** If 40 CFIs will not take a free unlimited tool that saves them prep time, cash will not save it and you learned it for free.

- **Pass:** >=50% of enrolled CFIs refer >=1 student · >=3 students per active CFI · >=30% trial-to-paid · >=60% of buyers still active at day 60.
- **Fail:** <30% refer anyone · OR <2 students per active CFI · OR day-60 activity <40%.
- **Instrument the dormancy rate** -- how many enroll and never refer. No vendor in the industry publishes it. It is your actual answer.

---

## 20. KILL CRITERIA (60-90 days)

1. **Week-4 repeat rate on the voice check below 25%.** This is the one that matters. Below it there is no habit, no retention mechanic, and no pricing change rescues it.
2. Fewer than 25 of 200 students hitting a $49 paywall complete a card authorization.
3. Fewer than 8 of 40 CFIs refer a single student when the tool is free.
4. Search volume for solo/checkride/chair-flying intent turns out to be negligible once measured.
5. Voice-check completion under 50% -- students open it and will not speak.
6. FlightSense ships retrieval practice or a readiness verdict. Not fatal alone, but it converts this from "build a business" to "sell the asset."

---

## 21. THE RED-TEAM CASE, AND THE REBUTTAL

**The case:** the exact product exists and nobody buys it -- MasterPilot 3 ratings, Aviate AI 11, Redbird Pro 6 after five years with GA's best distribution, against 244-325 for radio phraseology. The economics are dead: 24% education annual renewal, $22.82 median Year-1 LTV, a $25 bounty that exceeds it, 80% of students quitting at hours 10-20 inside the first billing cycles, 2-4 uses a month so no habit is possible. FlightSense already sells to students at $15 and gives school-seated students unlimited access free. The differentiators are one sprint wide. The channel is 6x smaller than assumed and nobody publishes referral results because there are none worth publishing. The founder has now been beaten to three "white spaces" in a row, all discovered after building strategy on top of them. And the glasses project is a founder reaching for a bigger vision precisely as the floor gives way. The built product is not evidence of a business -- it is the reason he cannot see there isn't one.

**The rebuttal, audited claim by claim.** Five of eight collapse. *"The pivot rate is the finding"* is near-false -- the thesis changed within 24 hours of discovering that two of its load-bearing claims had shipped elsewhere; that is responsiveness, and the red team's own argument depends on those corrections being right. *"The fifth entry in a category with a documented zero"* attacks the previous thesis, not this one -- the research's own inference is that products selling a **specific, feared, testable** skill retain, which is what a solo blocker list is and what AI reflection is not. *"Chair flying is unsold because an unmonetized gap is a grave"* is an aphorism contradicted by the buyer, who already chair-flies badly on her couch and would pay for it. *"FlightSense took the student"* -- they took the positioning; they still report the same 750 pilots as months ago, and their own guest tier leaves a segment underserved and invisible. *"Three for three"* is three instances of one unusually well-documented competitor, not a law.

**What survives is decisive and is honored above:** the unit economics, the 6x channel cut, the cash referral, the radio island, and the fact that post-flight AI reflection does not sell. **Those kill the pricing model and the channel plan. They do not touch the two things the buyer said she would pay for today, which nobody sells.**

---

## 22. FINAL RECOMMENDATION

**If this were my money and the next six months of my life, I would spend two weeks building one screen, and let a single number decide everything after it.**

Build the Flight-Grounded Voice Check. Three questions from the student's own last debrief, answered out loud, delivered as audio, in the two slots the buyer named -- the drive home and the night before the next lesson. Ship it free to 40 students. Watch **week-4 repeat rate**.

Above 25%: you have the only retention mechanic anyone found in this market, and you build "what's standing between you and solo" behind a $49 eight-week price, and the searchable record of what your instructors actually said -- which is 90% built and which the buyer valued at $20 on its own.

Below 25%: stop. Not "pivot again" -- stop. Sell or shelve it. That number is the honest test of whether a student will do anything at all between flights, and every other question in this document is downstream of it.

And while it runs, buy the $150 keyword seat, because the single largest gap in three dossiers of research is that **nobody knows whether students search for this**, and you have been making strategy for two days without that number.

Two things to hold onto, though. The moat nobody costed is **"am I behind?"** -- benchmarking a student against comparable students. It requires a cohort dataset you cannot have at 750 pilots, which makes it both the real cold-start problem and the only durable defensibility anyone named in two councils. Everything you build should accumulate toward it.

And the reason to keep going at all is not in any competitive matrix. It is that a real student pilot, asked what she wanted, said she lies awake not knowing whether she is 40% or 60% done after spending twelve thousand dollars -- and that nobody, in a market with five funded entrants, is answering her.
