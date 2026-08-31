# RESET COUNCIL — CONSOLIDATED EVIDENCE (live research, 31 Aug 2026)
Three independent agents. [C]=confirmed w/ URL+quote · [I]=inference · [GAP]=searched, not found.

## A. THE KILLER FINDING: THE EXACT PRODUCT ALREADY EXISTS AND NOBODY BUYS IT

| Product | Price | iOS ratings | Stars |
|---|---|---|---|
| MasterPilot (AI debrief, maneuver scoring) | $259.99/yr (~$21.67/mo) | **3** | 2.3 |
| Aviate AI (flight recording + cockpit audio + AI debrief) | **$29.99/mo** | **11** | 3.9 |
| Redbird Pro (backed by biggest sim maker in GA, launched 2021) | $15.99-19.99/mo | **6** | 5.0 |
| CloudAhoy (category original, 14 yrs) | $65/$150 per yr | **35** | 3.4 |
| **PlaneEnglish ARSim (radio phraseology)** | ~$96/yr | **325** | 4.1 |
| **Comms: AI Pilot Training (radio)** | $14.99/mo | **244** | 4.2 |
| FlightSense | $15/mo | 8 | 5.0 |

[C] Aviate AI's own listing: "flight recording capabilities with cockpit audio and GPS data capture, plus AI-generated performance summaries after landing." Nov 2025. 11 ratings.
[I] LOAD-BEARING: the split is NOT price -- Sporty's charges $60/mo and survives. Products selling a SPECIFIC, FEARED, TESTABLE skill retain. Products selling AI-generated post-flight feedback do not. ~50x gap between similarly-priced, similarly-aged aviation subs.

## B. RETENTION -- THE STRUCTURAL PROBLEM
[C] RevenueCat State of Subscription Apps 2026 (75,000+ devs, 1B+ transactions, $11B):
 - AI apps annual retention **21.1%** vs non-AI **30.7%**
 - AI apps monthly retention **6.1%** vs non-AI **9.5%**
 - AI refund rate 4.2% vs 3.5%
 - Verbatim: "AI-powered apps struggle to retain subscribers, with people canceling their annual subscriptions 30% faster than non-AI apps"
 - BUT AI apps convert trials **52% better** and monetize 20% better initially -> novelty spike then faster collapse
[C] Education category: annual renewal **24% median** (2nd worst); median monthly price **$9.99**; median annual **$44.99**; **Year-1 realized LTV per payer = $22.82**; download->trial 6.5%
[C] Education has the HIGHEST WEEKLY renewal (58%) -- RevenueCat: these apps retain best "when offered plans that match the duration of their goal"
[I] $19.99/mo is 2x the education category median monthly price.
[I] Duolingo does NOT transfer: its retention is daily-habit gamification on a 160M-MAU free tier, with AI sold as an upsell ON TOP of an already-retaining loop. AfterFlight's cadence is 2-4 events/month. No streak mechanic possible.
[C→I] NO evidence AI personalization improves retention. The only large-n dataset shows the opposite.

## C. THE TRAINING WINDOW
[C] PPL takes 3-6 months typical, 6-12 slow; ~55 hrs avg vs 35-hr minimum.
[C] **~80% of student pilots quit** (AOPA/APCO). Reasons are NOT cost or aptitude: loss of momentum, poor communication, feeling misled. ~35% of instructors rated not sufficiently professional/good teachers.
[C, secondary] Dropout clusters at **hours 10-20** ("15-hour cliff"), second cluster after first solo.
[I] At ~2 flights/wk, hours 10-20 = month 1.5-3 -- the cliff lands INSIDE the first few monthly cycles.
[I] Max theoretical LTV at $19.99 for a student who FINISHES: $80-160 gross. Completion probability ~20%.
[C] FAA 2025: 370,286 active student pilots BUT only **58,761 new student certificates issued in 2025** (down from 61,353). Certificates have not expired since 2016.
[I] **Model TAM off ~59k/yr new entrants, not 370k.**
[C] 69% of certificated pilots hold an instrument rating (denominator includes CPL/ATP where IR is mandatory).

## D. AI UNIT COSTS -- NOT A CONSTRAINT
[C] Deepgram Nova-3 streaming $0.0077/min regular ($0.0048 promo). Aura-2 TTS $0.030/1k chars. Claude Opus 5 $5/$25 per MTok; Sonnet 5 $3/$15; Haiku 4.5 $1/$5.
[C via arithmetic] Per debrief (5 min STT + 15k in/3k out + 2 min TTS): Opus5+Aura2 = **$0.238**; Sonnet5+Aura1 = $0.153; Haiku4.5 = $0.079.
[C] Per student-month (4 debriefs + 8 lessons/quizzes): **$0.40-$1.53**, i.e. **2.8-10.9% of net revenue**. Apple's 30% cut is 4-15x the entire AI bill.
[I] Optimize for debrief QUALITY, not token cost.
**[C] CORRECTION: the "Deepgram MIP 50% discount" claim is UNVERIFIED.** Deepgram's own pricing page mentions no MIP discount. The claim traces ONLY to Gladia, a competitor. Model opt-out as cost-neutral until confirmed with a Deepgram rep.

## E. WHAT A STUDENT ACTUALLY GETS FROM FLIGHTSENSE
[C] **Amelia does NOT teach.** Doc's own "What Amelia is not": "Aware of your current-session flight context **unless you explicitly attach it**." It is Q&A over FAA material; student must manually "Add Log Context" with ONE completed debrief per thread.
[C] Marketing says Amelia "turns any flight log into a focused study session." The doc describes attaching context to a chat. No artifact, no generated lesson, no completion state.
[C] **ZERO retrieval practice.** All 44 academy articles grepped: no quiz, flashcard, spaced repetition, question bank, practice test, mock oral. "Knowledge check" = an INSTRUCTOR-GRADED lesson item. **The student never answers a question inside the product.**
[C] Student surface is **read-only**, stated 4 ways: "All debrief log content is read-only for students. Your instructor handles all grading, lesson linking, and task entry."
[C] Student CAN: record their own voice debrief (explicitly endorsed for solo flights), delete their own logs (blocked once an instructor links a lesson), chat with Amelia.
[C] Amelia rate-limited on free tier ("8 messages remaining in 24-hour window" example); unlimited for premium/org-covered.
[C] **"Track checkride readiness" is a pricing-page bullet with NO feature behind it** anywhere in 44 articles. Marketing, not shipped.
[C] Amelia chats are "not visible to your school, your instructor, or other members. They're yours."

### CORRECTIONS TO THE 30 AUG DOSSIER (material)
[C] **1. FlightSense SHIPS PORTABLE STUDENT RECORDS.** 8-char ID, not email: "If you transfer to a different school, your debrief history, grades, and progress follow your FlightSense ID." Also: school "cannot access... any training data from before you were connected to their organization. Your training data belongs to you." **"Student-owned portable record" is NO LONGER white space.**
[C] **2. They ACTIVELY SELL THE HANDOFF STORY as the lead wedge.** Recovered FAQ: "makes handoffs about ten times easier, and it's often the first problem they feel us solve."
[C] **3. There IS a free tier** (guest members, rate-limited Amelia, premium tabs paywalled). Prior "no free tier" was wrong.
[C] 4. Full data export available: "full data export is available if you ever move on."

### WHO PAYS FOR THE STUDENT SEAT -- it is BOTH, chosen per-student
[C] Individual Pilot **$15/month "For student pilots & independent CFIs"**, 14-day trial no CC. Flight School $15/seat/mo, 30-day trial.
[C] "Occupies paid seat" toggle. Guests don't count against seat limit and don't get premium.
[C] Recovered FAQ: "you can mix approaches student by student... add them as a guest and have them keep their own individual FlightSense subscription, so your school isn't paying for that seat... Or keep them on a school seat and recover the cost as a fee on their training bill."
[C] School-paid seat -> student gets premium "at no personal cost."
[I] THREE STATES: (a) school-paid -> student pays $0, unlimited Amelia + full Insights; (b) guest w/ own sub -> $15/mo; (c) guest, no sub -> $0 with crippled app, Insights/Progress/Checks paywalled. **(c) is the underserved segment and is invisible from outside.**
[C] Still "more than 750 pilots" -- same number as months ago. 8 App Store ratings, no growth in ~a year.

## F. THE COMPETITIVE SEAM (exhaustive scan, 14 products)
[I] **Every competitor either (1) has the student's real flight data and does nothing pedagogical with it -- FlightSense, Atlas, Navi -- or (2) does real pedagogy from data that is NOT the student's flying -- PilotTrack, Sporty's, check-ride.ai, Gleim. NOBODY CROSSES.**
[C] PilotTrack, closest positioning competitor: "The AI flight instructor that knows your progress," $29.99/mo, 439 ACS lessons, 6,407 questions, CFIs free for life, "You're 86% ready." Its personalization reads "your logbook hours, your quiz history, the lesson you last finished" -- [I] HOURS TOTALS, not debriefs/telemetry/instructor grades. Quiz-miss adaptation dressed in logbook language.
[C] Sporty's ChatCFI capped at 100 questions/month. Has FAA Knowledge Test Analysis -> custom study plan from WRITTEN TEST scores only.
[C] Gleim Cross-Check: free to every CFI, reports quiz misses. Zero flight data.
[C] Atlas: holds ACS-graded CFI-signed debriefs and builds NO tutor, NO readiness verdict, NO gap analysis on top. Data layer with no intelligence layer.
[C] **Price band for AI subs: $12.99-$29.99/mo.** One-time content: $99-$299. $20/mo is mid-band but crowded, and **FlightSense undercuts at $15 while holding the most data.**

## G. CHAIR FLYING & GRADED VOICE
[C] **NOBODY SELLS CHAIR FLYING.** [GAP after exhaustive search.] Dauntless Flight Deck uses the words but is silent and ungraded.
[C] **Graded voice EXISTS only for radio phraseology and oral exams -- both saturated, and radio RACES TO FREE:** SkyPrep Radio Sim FREE ("grades your phraseology word by word"); ATC One free starter / $6.67/mo; ARSim $8/mo annual; Comms $14.99/mo.
[I] **LOAD-BEARING: graded radio phraseology has ZERO pricing power. It bottoms out at free.**
[C] PilotEdge grading is by LIVE HUMAN CONTROLLERS -- does not scale.
[GAP] **The precise hole: voice evaluation of MANEUVER/PROCEDURE RECITATION ("talk me through a power-off 180 from memory") does not exist. Nor does rehearsal tied to a specific upcoming lesson.**

## H. CHECKRIDE READINESS
[C] check-ride.ai: credit-based, first session free, grades against INDIVIDUAL ACS CODES (e.g. "PA.I.E.K1"), returns Satisfactory/Marginal/Unsatisfactory per area, "color-coded rubrics, flagged knowledge gaps, trends." ONLY oral product with a CFI loop (results sent to your CFI). **Zero flight data -- infers from a simulated conversation.**
[C] Checkride.bot: $49.99 PPL, voice-only, 30 days unlimited no auto-renew, per-answer SAT/UNSAT with the exact FAR/AIM reference.
[C] Gleim Otto $124.95 intro (reg $299), Private only. CheckrideAI $399 one-time. Flight Levels $29/mo.
[I, high confidence] **An explainable readiness verdict grounded in the student's REAL FLIGHT PERFORMANCE does not exist. FlightSense holds the real data and issues no verdict; Atlas holds it and has no readiness feature at all.**

## I. THE CFI CHANNEL
[C] **Jason Blair, from FAA cert data: only 23,649 CFIs signed off a practical-test applicant in 2025** -- and it DECREASED for the first time in years (airline hiring down). More CFIs cleared 5+ signoffs = modestly longer tenure. One CFI signed off 200+.
[I] **23,649 / 145,538 = 16.2% of CFI certificate holders. Use ~24k as the commercially relevant core, not 145k. Realistic actively-instructing: 35,000-55,000. This cuts the channel ~6x.**
[C] **THE INDUSTRY PATTERN IS FREE-TOOL-PLUS-DASHBOARD, NOT CASH:**
 - King Schools: **$0 cash**, ~$1,500 of free courseware + Instructor Dashboard showing each student's progress. Largest free CFI program in GA.
 - Gleim: $0 commission, free directory listing, 25% personal discount.
 - PlaneEnglish: free instructor+admin access; the 15% discount goes to the STUDENT, not cash to the CFI.
 - Part Time Pilot: leads with "FREE Ground School Access to **Track your Students**."
 - Aviatize: instructors priced at zero on principle.
[C] Cash programs that exist: **Sporty's $25 e-gift card** per course purchase (8.4% of a $299 course, in scrip). **ForeFlight: subscription CREDIT** -- 20% off first referral, +5% each after, up to 100% off; requires the student complete **five signed logbook entries** with that CFI. Rod Machado 25% cash. FlightInsight 20% cash ($116/sale). Pilot Institute 20% but **gated to content creators, not rank-and-file CFIs**.
[C] Dec 2025: ForeFlight CUT the CFI discount 33%->15% and introduced the referral program as the replacement -- generating visible CFI anger.
[I] A CFI converting 15 students at $25 earns $375/yr -- under one week of CFI wages. **The cash is a token. The motivating asset is the free dashboard that returns unpaid admin time.**
[GAP] **NO vendor anywhere publishes referral results.** Zero conversion rates, zero enrollment counts, across every program searched. [S] If these worked well, marketing would say so.

### ETHICS -- real but soft
[C] The only authority: a SAFE-authored FAA/FAASTeam Instructor Professionalism guide poses it as an open question -- "whether accepting a referral fee from a vendor is acceptable or constitutes a 'kickback' that should be rejected or disclosed to an employer."
[I] **The disclosure duty runs to the EMPLOYER, not the student.** The risk is a CFI pocketing money the school thinks is the school's.
[C] SAFE Code of Ethics: NO commercial/conflict clause. NAFI Code of Ethics: NO commercial clause. No FAA reg on referral fees. No student complaint found anywhere.
[S] Mitigation: make the incentive CREDIT toward the CFI's own access (ForeFlight's exact design), which removes the kickback framing.

### REACHABLE CFI CHANNELS
[C] NAFI: **8,500 members**, $59/yr. Takes vendor money -- "20+ Industry Partners"; 2016 rate card: **NAFI Advocate tier $30,000+**. Free route in: the partner-DISCOUNT slot (ForeFlight 15%, King 20%, Sporty's 20%, CloudAhoy 33%, ASA 20% already there). Channels: weekly eMentor, Mentor Magazine, monthly MentorLIVE.
[C] SAFE: size [GAP]. **"Member contact information is automatically transmitted to certain trusted vendor partners"** -- SAFE will hand a partner its member list.
[C] CFI Study Group (Facebook) ~8,000 members, free.
[C] AOPA Flight Training Experience Awards: **4,200+ reviews** in the 2026 cycle; public winners+distinguished PDF. [I] Highest-quality small list -- pre-qualified for caring about student experience.
[C] FAA Releasable Airmen Database: complete, monthly, **postal addresses but NO email**, excludes opt-outs. [I] ~$15-25k to touch every CFI once by mail.
[GAP] No aviation list broker with published email pricing.
[I] **Total cheaply-reachable engaged CFIs: ~10,000-15,000 unique, heavy overlap.**

## J. STUDENT COMMUNITIES
[C] r/flying **485,000** members, +13.8%/yr. r/AskFlying 7,000. r/Pilot 4,000. **Reddit is TOOL-BLOCKED -- all Reddit sizing is third-party-derived; r/StudentPilots and r/flightinstructors are [GAP].**
[C] Pilots of America: active, fetchable, real CFIs -- the most researchable forum. Prior dossier documents COLD receptions there for new tools ("Why not just put notes on a knee board?").
[GAP] No search-volume data for "am I ready for my checkride" / "practice ATC calls" / "chair flying" is publicly retrievable. [I] Needs a $100-200 Ahrefs/Semrush seat -- budget it, don't keep searching.

## K. AFTERFLIGHT'S OWN BUILD STATE (verified from source)
Already shipped: voice debrief + Deepgram transcription w/ diarization, Claude analysis, instructor attribution, student self-assessment, CFI assessment, **/compare perception gap (rank distance -> none/minor/significant)**, ACS mapping, FlightScore, needs-work/action items, next-lesson focus, **synthesized CFI handoff brief**, study references + open-tracking, **cross-instructor recurrence w/ timeline**, skill trends, progress history, school/admin views, **Debrief Replay TTS audio**, multi-org, Stripe billing, entitlements (3 free student flights), **radio practice module (scenario bank, scoring, AI judge, radio audio effect)**, consent capture w/ policy version, transcript retention/purge, content/SEO engine.
NOT built: any quiz/retrieval-practice mechanic, any generated micro-lesson, chair flying, checkride readiness verdict, multimodal/telemetry.
NOTE: radio practice currently writes ONLY to radio_practice_assignments -- it does NOT feed training_signals. It is an island.
