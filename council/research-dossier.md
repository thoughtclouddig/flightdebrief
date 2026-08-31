# AFTERFLIGHT — CONSOLIDATED RESEARCH DOSSIER (live web research, 30 Aug 2026)
Four independent research agents. [C]=confirmed w/ URL, [I]=inference, [S]=speculation, [GAP]=searched, not found.

## A. THE COMPETITIVE SET (verified)

### FlightSense — flightsense.ai — CLOSEST DIRECT COMPETITOR
[C] Founded 2024, Lehi UT. CEO Taylor Horsager (commercial pilot + CFI + engineer). Mobile launch Nov 2024; v2.0 Jan 2026 (Part 141 records); FULL OPS PLATFORM Aug 2026 (scheduling, dispatch, maintenance/AD/ARROW, meter-based invoicing).
[C] 750+ pilots (note: pilots, not schools). iOS only, no Android. App Store 5.0 from only 8 ratings (~1% review rate).
[C] Pricing: Individual Pilot $15/mo; Flight School $15/SEAT/mo; Enterprise custom (SSO, API, SLA). No free tier. Explicitly tells schools to pass seat cost to students.
[C] SHIPPED (verified in a deep ~35-article help-doc set at /academy):
 - one-tap voice debrief -> AI transcript + summary; STUDENT SELF-DEBRIEF mode (voice only, no instructor association)
 - ACS tasks PREDICTED from the debrief summary; below-target grades auto-flag
 - ACS proficiency by Area of Operation as running average; course progress by stage w/ transfer credits
 - "Amelia" AI assistant on FAA source material w/ citations; "Add Log Context" attaches a completed debrief to a chat thread
 - stage checks + chief digital signature via one-time code; grade edit re-locks record to "Re-Sign Required"; tamper-evident
 - one-click full FSDO export
[C] **SHIPS DEBRIEF-QUALITY SCORING**: instructor evaluations assess "instructor effectiveness -- debrief quality, teaching patterns, adaptability, emphasis on safety," explicitly incl. "Debrief structure and content -- are post-flight debriefs covering what they should?" (/academy/admin-portal/reviewing-performance-evaluations)
[C] **SHIPS CFI ANALYTICS FROM DEBRIEF CONTENT**: instructor evaluations "drawn from debriefs they authored"; sold as instructor performance tracking.
[C] Multi-lesson weakness detection: performance evaluations analyze "up to the most recent 15 logs" -> Strengths / Areas for Improvement.
[C] DOES NOT HAVE: prior-lesson context surfaced during a debrief (no continuity); no handoff artifact anywhere in docs; NO self-vs-CFI discrepancy comparison (they capture BOTH inputs and never diff them); no audio recap (audio is input only, local copy deleted after processing); no cross-instructor slicing (admin instructor table shows only name/email/log count/last activity); no study resource library or open-tracking; org-scoped record, follows the school not the pilot.
[C] FAQ *lists* "What happens when an instructor leaves?" and "Who owns our data, and can we get it out?" -- answers are JS-rendered, unreadable. HIGHEST-VALUE UNKNOWN.
[C] Launch blog claims early adopters saw "enhanced continuity when transitioning between instructors" and names the problem: "Crucial teaching moments have been lost between lessons."
[C] Part 141 LOA: ONE school's principal inspector accepted it. [I] An electronic-recordkeeping LOA is a ROUTINE POI notification under AC 120-78B, not a scarce approval. NOT A MOAT.
[C] Feb 2026 integrated with Sky Schedule; Aug 2026 built its own scheduling and no longer needs the partner. Category consolidating fast.
[C] No funding disclosed, no trade-press in AVweb/Flying/AIN, no G2/Capterra/Reddit presence. Press-led, not community-led.

### Navi AI — flynavi.com — BEST CAPITALIZED
[C] ~$6.0-6.7M: $1.5M pre-seed Apr 2024 + $3.35M seed Mar 2026 + $1.27M SBIR Phase II from U.S. Dept. of War (USAF Test Pilot School / T-38). Out of stealth 23-25 Mar 2026. SF. CEO Nikola Kostic, CTO Vivek Velivela. 7 employees, hiring 15.
[C] Investors: UNITED AIRLINES VENTURES, BVVC, New Vista, Raptor Group, I2BF.
[C] Customers: Sling Pilot Academy (commercial since Sept 2024), EMBRY-RIDDLE (partner AND equity stakeholder), Univ. of North Dakota, PURDUE, Utah State, Delta State, USAF Test Pilot School at Edwards. Garmin named.
[C] Fuses cockpit audio + avionics telemetry + ADS-B + weather + the school's own syllabus. Proprietary LLM on 100,000+ flight hours. 40-50 insights per flight, phase-by-phase, interactive reports w/ text/visuals/animations. ACS-coded errors -> personalized study plan w/ links.
[C] Requires GPS iOS device + AUDIO RECORDING CABLE. App gated: "limited to partner schools only, not available for personal use." 4.6 stars from only 16 ratings after ~2 yrs commercial.
[C] NO published pricing anywhere. B2B2C, school pays.
[C] DOES NOT HAVE: handoff brief (absent from PR, App Store, ERAU, AIN, AVweb); cross-instructor continuity; self-vs-CFI discrepancy; AUDIO OUTPUT (ingests audio, outputs text/visuals -- do not confuse); portability across schools (school-gated, dies on transfer); debrief-quality scoring (it scores the FLIGHT); CFI analytics.
[I] It debriefs the AIRPLANE, not the conversation. Telemetry-derived. The instructor's judgment and the student's stated confusion are not the substrate.
[C] Negative App Store review criticizes support responsiveness + instructor UI.

### Atlas / DebriefCFI — atlascfi.com — SAME COMPANY (debriefcfi.com 307-redirects to atlascfi.com; support@debriefcfi.com; entity Aetherion Arc LLC). CLOSEST STRATEGIC TWIN.
[C] Launched 2026, months old. ZERO traction: no App/Play listing, no press, no funding, no reviews, no forum mentions. "Atlas" is heavily SEO-collided in aviation (Atlas Air etc.) -- their SEO is unwinnable as-is.
[C] Pricing INVERTS Navi: Atlas Debrief $0 forever up to 4 students (CFI); Attached CFI $0 (rides free on student's sub); CFI Pro $490/yr; Atlas Student $490/yr; Atlas Flightdeck $990/yr ("most popular"); school plan unpriced, CFIs+admins free. THE STUDENT PAYS, THE CFI RIDES FREE.
[C] SHIPPED: dictation built in, free; graded against real ACS (tasks/tolerances/common errors); "Sign it: a locked record with your name and CFI number"; "Share it as a clean page -- DPEs, parents, THEIR NEXT CFI"; checkride-readiness ACS gap map; study from FAA handbooks + FAR/AIM 2026 + ACS + NTSB/ASRS + school-uploaded syllabi/POHs/SOPs; knows "each student's phase, aircraft, and weak areas"; SPACED REPETITION "for the gaps your training actually exposes"; mock orals.
[C] **SHIPS STUDY-ENGAGEMENT TELEMETRY** (their sharpest feature): "visibility into student study patterns and comprehension gaps"; pre-lesson briefings showing what the student covered and "where comprehension is thin"; early warning "when a student goes quiet or slides on a topic."
[C] CFI Pro: "Bring any student -- even those not on Atlas yet"; "Your roster and records stay yours -- ONE PLACE, NOT THE SCHOOL'S" (anti-school-lock-in, addressed to the INSTRUCTOR).
[C] School tier: retention dashboard (days in phase, overdue review, quiet students); CFI HOUR TRACKING -- "watch instructors approach their hours so you can plan hiring before they leave." Built around CFI turnover. SchedulePointe integration.
[C] Recorder cable included after first paid invoice (hardware, like Navi).
[C] DOES NOT HAVE: synthesized handoff brief (shares a PAGE to "their next CFI" -- an artifact, not a synthesis); cross-INSTRUCTOR recurrence (not claimed anywhere); self-vs-CFI discrepancy (HOLDS BOTH DATA SIDES AND NEVER CONNECTS THEM -- one feature away); audio recap (audio is input only); debrief-quality scoring; CFI QUALITY analytics (tracks CFI HOURS not quality); student-owned record (made it CFI-owned).

### Wingman — apps.apple.com/us/app/wingman-flight-training-help/id6759298352 — NOT A REAL COMPETITOR
[C] Solo indie. Developer "Hayden Teteak" (personal Apple account; Android pkg com.haydenteteak.wingman). No company, no funding, no press, no team. v1.3.3 (17 Mar 2026). FREE, no IAP, NO REVENUE MODEL. App Store: "not enough ratings" to display a score. Play: ~500+ downloads [I, index-derived].
[C] CLAIMS verbatim "instructor handoff continuity briefs" -- THE ONLY COMPETITOR THAT NAMES THE HANDOFF USE CASE. Zero proof of implementation; no screenshots, demo, PH launch, or review found anywhere.
[C] v1.3.3 release notes show a PIVOT toward authored PPL ACS study content / lesson libraries / mastery tracking -- i.e. drifting to ground school.
[I] Has NO CFI account surface, so its "handoff brief" can only be built from student-side data. It names the problem it structurally cannot solve.
[C] Name collides with 6+ unrelated products (WINGMAN Aero SMS, Wingman Pilot Logbook, WingmanFix, Wingman Academies, Flight Deck Wingman).

### "Aviatron / TopGun Training" — DOES NOT EXIST
[C] No flight-training product by either name. Aviatron Inc. = FAA/EASA MRO repair station, S. Burlington VT, founded 1979, air cycle machines, ACQUIRED BY WENCOR OCT 2022. "Top Gun debrief" = a USN methodology written about in aviation press, not a product.
[I] The brief's Target 2 is almost certainly a garbled reference to Navi AI (feature-set match).

### ForeFlight / CloudAhoy — THE PLATFORM THREAT
[C] ForeFlight (Boeing) acquired CloudAhoy Apr 2023.
[C] CloudAhoy ALIVE, still sold standalone: free Track tier / $65 Standard / $150 Pro per yr; 33% NAFI+SAFE discount; 35-day trial. Rule-based engine, NOT an LLM. "CFI Assistant" dates to Oct 2019, unchanged.
[C] BUT: product blog's last post is the Apr 2023 acquisition announcement -- ZERO posts in 3+ years. ABSENT from ForeFlight's AirVenture 2026 lineup. [I] Being superseded, not sunset. No public sunset statement exists -- do not assert one.
[C] **ForeFlight Debrief SHIPPED (Summer 2025 release)**: auto maneuver/procedure/landing segmentation w/ quantitative scoring; approach grading (crossing altitude, GPS course deviation, sink rate, airspeed, circling accuracy); landing touchdown-distance analysis; shareable. Requires Essential plan ($260/yr). Web only, mobile "in the works." AI NOT claimed -- scoring, not generative. Presented to CFIs via NAFI MentorLIVE Sept 2025.
[C] **ForeFlight Scheduler, early access 15 Jul 2026**: aircraft + instructor scheduling, digital billing/invoicing, maintenance/inspection tracking, fleet utilization, AND TRAINING RECORDS; roadmap adds instructor qualifications, medical certs, student documentation. Target "independent flight schools to multi-location operations." Pricing undisclosed.
[C] **"Jeppesen ForeFlight Airflow" 1 Jul 2026**: agentic AI engine. First GA product = AI Connector, an MCP SERVER exposing ForeFlight data to ChatGPT; GEMINI AND ANTHROPIC CLAUDE PLANNED. Model-agnostic.
[C] CFI Referral Program: instructors earn subscription credits, students get discounts.
[C] ForeFlight pricing: Starter $130 / Essential $260 / Premium $390 per yr. Business Pro $280/license/yr, 2-license min.
[C] ForeFlight's instructor page STILL has no syllabus, lesson tracking, grading, or student progress.
[I] ForeFlight now holds: EFB distribution to nearly every US student pilot + track-log telemetry + logbook + scheduling + training records + an agentic AI engine. AI debrief/continuity is the obvious next adjacency into an install base no startup can match. HIGHEST-PROBABILITY FAST-FOLLOWER, ~12 months.
[C] ForeFlight churn is ACTIVE in 2026: "Price goes up every year, now they cut the SAFE discount in half. I am all done with ForeFlight" (1-star, 1 Jul 2026); "I will not be renewing" (6 Feb 2026); multiple 2026 reviews naming Garmin Pilot as destination.

### THE FOUR OPS INCUMBENTS ARE AT ABSOLUTE ZERO ON AI
[C] Flight Schedule Pro: grading explicitly MANUAL. Part 141 Training Hub = syllabi, enrollment certs, PIN signatures, POI reports. NO AI anywhere. Window spent on M&A (acquired Coradine/LogTen) + a $100M Wings Leasing fleet-financing deal. Pricing NOT published. User quote naming lock-in: "I didn't realize FSP also made LogTen. No wonder they won't share their API."
[C] Flight Circle: zero AI. $10/mo per aircraft, UNLIMITED users and instructors. [I] Least margin headroom in the category to fund inference.
[C] Talon Systems/ETA: zero AI; 2026 blog is purely operational. Enterprise quote-only. Customers Embry-Riddle, Western Michigan. [I] LOAD-BEARING: ERAU is a Talon customer AND a Navi equity stakeholder -- it went OUTSIDE its incumbent TMS for AI debrief rather than wait.
[C] Coflyt: zero AI. ~$24/mo indiv, $43/mo Plus. Aircraft-ownership product; no lesson data model to attach AI to.

### COURSEWARE INCUMBENTS SHIPPED STUDENT-FACING AI, NOT DEBRIEF
[C] Sporty's (Oct 2025): ChatCFI (24/7 AI instructor, custom study guides, capped 100 questions/mo), ChatDPE, ChatFAR. $299 ONE-TIME (Pilot Training+ $399/yr). NO instructor debrief, lesson grading, or handoff. Presenting sponsor of Redbird Migration 2026.
[C] Gleim (23 Jul 2025, AirVenture): "Otto" (generative AI DPE oral sim) + "Cross-Check" (analytics, FREE TO CFIs on Gleim ground school). Ground-school analytics only.
[C] King Schools: ANNOUNCED Jul 2025, NOT SHIPPED. Jul 2026 announcement contains no AI at all. Laggard.
[C] PlaneEnglish: "Q&AI" phraseology + "Volo" beta (Apr 2026) in-app sim w/ AI ATC. ~$8/mo annual. No grading/debrief/handoff.
[C] Redbird GIFT: "AI-powered maneuvers training," in-flight spoken coaching, post-flight score + cross-flight trends, $249 LIFETIME. [I] FAQ never says AI; likely rules-based sim telemetry. Redbird Migration 2025 AND 2026 produced NO AI announcement.
[C] CAE Rise: real-time instructor insights, competency assessment, AQP/EBT, roadmap adds eye-tracking + biometrics. Airline/Level-D segment, NOT Part 61/141. Launched 2018.
[C] Conference sweep: NBAA-BACE 2024/2025, AirVenture 2025 (only Gleim), AirVenture 2026 (only ForeFlight), Sun'n'Fun 2025/26, Redbird Migration 2025/26 -- CONFIRMED ABSENCE of third-party AI flight-training debrief announcements.

### OTHER ENTRANTS
[C] MasterPilot masterpilot.aero: auto-detects 19 PPL/CPL maneuvers, 1-10 ACS scoring, 3D reconstruction, AI debrief "mimics guidance from a real-life flight instructor." NO CABLE NEEDED (Stratus/Stratux/Garmin/Dynon/ForeFlight logs). $239.99/yr. Claims 1,990 users, 27 teachers -- but self-reports only "252 hours flown," [I] very low real engagement.
[C] Hilo Aviation: "replaces the 7-10 tools cluttering your operations." Hilo Connect in-cockpit device, FlyLingo AI test prep, Flight Risk Center pre-dispatch scoring, AI Curriculum Intelligence (FAA compliance analysis <60s), LENDER INTEGRATION for milestone-based fund disbursement. Priced per equipment, amounts unpublished. AOPA coverage Apr 2025.
[C] VectoredOps: record spoken debrief -> AI transcribes/extracts/structures. Pitches at STUDENT DROPOUT/RETENTION. $79/mo + $79 setup, or $790/yr, or $997 lifetime. Instructor portal free; WAIVED for NAFI/SAFE members. [S] reads like a response to a CFI-adoption wall.
[C] WiseCFI (iOS, Oct 2025): CFI-side, free to 5 students, Pro $1.99/mo or $14.99/YR. ACS-based, PDF export. 5.0 from 1 rating. Not updated in 10 months -- [I] likely abandoned. PRICE ANCHOR: $14.99/yr vs Atlas $490/yr for a similar job.
[C] PilotTrack: voice AI CFI, 439 ACS lessons, 6,407 questions, mock DPE orals, readiness %. $299/yr, free tier, CFIs LIFETIME FREE.
[C] Aviate AI: ATC sim + records real sessions -> AI summaries. $29.99/mo, $199.99/yr. 3.9 stars/11 ratings.
[C] NextRating: free debrief app for independent CFIs, beta Jun 2026, NO AI.
[C] FlytWERX: MSFS + real via Stratus. 21+ maneuvers, MAX and AVERAGE deviation (peak error vs consistency -- a real differentiator). "10-second debrief," red/yellow/green, ACS-aligned. $19.99/YR sim-only; $199/yr in-air+sim. NO AI CLAIMED. No handoff. [I] Cheapest price in category; sets the floor for telemetry-only scoring.
[C] Aviatize ($29/aircraft/mo): **ALREADY SHIPS CONTINUITY TRACKING** -- "tracks instructor continuity and alerts you when a student has been training with many different instructors, which can slow progress and hurt retention"; "replaces the training folder on a CFI's desk with a live digital record."
[C] Pilot Rise (a FLIGHT SCHOOL) built its OWN system: 1-5 AQP scoring, optional AI debrief requiring instructor approval, and markets: "Whether a student flies with the same instructor or switches occasionally, our system makes handoffs seamless. Instructors can instantly understand where a student stands, reducing repeat instruction." [I] A school building this in-house = problem validation AND build-vs-buy risk.
[C] Academic: peer-reviewed "AI-Assisted Debrief: Automated Flight Debriefing" (SciTePress 2024). The primitive is published and non-proprietary.

## B. MARKET STRUCTURE

[C] FAA 2025 Civil Airmen: 145,538 active CFI certificates (+5.4%/yr); 370,286 active student pilots; 118,314 commercial airplane.
[C] WARNING: student pilot certificates have NOT EXPIRED SINCE APRIL 2016 -- 370,286 is a cumulative stock, structurally inflated. Do NOT use as "students training this year."
[C] 509 certificated (Part 141) pilot schools; only 74 (14%) hold examining authority. "Approximately 77% of private pilot training is done outside of part 141."
[C] PPL certification events 2023: Part 61 33,034 vs Part 141 7,042. 2013->2023 Part 61 +116%, Part 141 +52%.
[C] IBISWorld: 1,105 businesses, $4.9bn US market 2025, +4.4%.
[I] CONVERGENT ESTIMATE via two independent methods: ~3,000-4,800 US Part 61 schools with ~3-15 CFIs. Point estimate ~3,500. WEAKEST NUMBER IN THE DOSSIER -- no source publishes CFI-headcount distribution by school.
[I] CAVEAT: "Part 61 school" and "Part 141 school" are NOT disjoint -- most 141 schools also train under 61. Treating them as separate buckets overstates TAM.
[C] Most US flight training orgs operate 10 or fewer aircraft; typical Part 61 school 2-5 airplanes; >63% of independent instructors use their customers' aircraft. The LARGEST Part 141 school (Epic) averages ~13 CFIs per campus.
[C] Margins: "net profit margins between 5% and 15%" and "a significant number operate at breakeven or run at a loss."

### SOFTWARE PRICE ANCHORS
[C] Flight Circle $10/aircraft/mo unlimited users · Wingtrex $9 · Schedule Master $8-12/resource · AircraftClubs $12-18/aircraft + $6/instructor · Aviatize $29/aircraft/mo + $1,000-5,000 onboarding · Coflyt $24-120/mo · MyFBO $59/mo (CLOSING 31 AUG 2026 after 25 yrs) · Sky Schedule $79/mo per aircraft · FlightSense $15/SEAT/mo · VectoredOps $79/mo.
[C] NOT PUBLISHED AT ALL: Flight Schedule Pro, Talon ETA, FlightLogger, ForeFlight Dispatch/Scheduler, Navi, Hilo, CAE.
[I] There is essentially NO self-serve price point between ~$90/mo and "call us." The mid-market has ceded the sub-5-aircraft segment.
[I] PER-AIRCRAFT PRICING CAPS THE CATEGORY: an 8-aircraft school is an $80-230/mo account regardless of student or CFI count. Only FlightLogger (per active student) and FlightSense (per seat) scale with the actual revenue driver.
[I] MODEL SCHOOL (8 CFIs, 8 aircraft, ~70 students): true school-paid software $275-700/mo (~$3,300-8,400/yr), midpoint ~$400/mo. CARD PROCESSING ($2,100-4,300/mo) DWARFS SOFTWARE SPEND 5-10x.

### STUDENT-SIDE WILLINGNESS TO PAY — THE SHARPEST ASYMMETRY
[C] ForeFlight $130/$260/$390 per yr, bought individually by students. Sporty's $299 one-time; **Pilot Training+ $399/YEAR RECURRING** aimed at student pilots -- strongest recurring-WTP datapoint. King $349/$599. Gleim $224.95/$289.95. PlaneEnglish ~$96/yr for ONE narrow skill. PilotEdge $179-329/yr. Redbird Pro $15.99-19.99/mo. LogTen $79.99-129.99/yr. MyFlightbook $0 donationware.
[C] AOPA on PPL cost: "$6,000 to $20,000 or more"; study materials ~$250. Realistic 2026 all-in $15,000-20,000. C172 wet ~$180-220/hr. CFI billed $60-90/hr; CFI WAGES $45-55/hr (ZipRecruiter Jun 2026 avg $45.49/hr; full-time $55-65k).
[I] A typical student voluntarily spends $600-1,100/yr out of pocket on software/courses -- 1.5-2x the ENTIRE MONTHLY SOFTWARE BUDGET of the school they attend. Materials are ~1.5% of a $17,000 PPL, so students are price-INSENSITIVE at this scale, while a $200/mo school line item is scrutinized by the owner.
[I] Student-side seat count: 105,000-150,000 actively training, +25-35% for IR/CPL/CFI -> 130,000-200,000 paying learners; ~55-75% already pay for >=1 training app -> **75,000-145,000 PROVEN PAYERS** vs ~3,500 small schools. ~An order of magnitude more seats.
[C] BUT THE CATEGORY'S PRICE MEMORY IS ANCHORED AT FREE. CloudAhoy was free until late 2013; App Store reviews split exactly on that line. Paywall era: "The $45 subscription fee is laughable" (1-star, titled "Subscription = Epic Fail", 9 Aug 2014); "the new subscription rate is horribly expensive... I've hit the 'delete' button"; "it's just not (yet) useful enough in a training environment to justify the cost."
[C] Explicit refusal sentiment: "Don't let others hold you hostage to subscriptions"; "Going back to my simple excel sheet... No fees, data under my control"; "LITERALLY EVERYTHING COSTS MONEY."
[C] Closest analogue "Comms: AI Pilot Training" ~$10/mo, 4.23 stars on 244 ratings -- shows the slot AND its ceiling: "just wish it was free because flight classes are expensive enough lol" and "This app is just charging a really high monthly subscription just for outsourced AI conversations. Use FREE resources that the FAA provides and your flight instructor."
[C] CFIs DO pay AND they ROUTE STUDENTS. Same reviewer: ForeFlight 1-star Apr 2026 "they've already slashed the CFI discount from 33% to 15%... I simply cannot support this"; Garmin Pilot 5-star May 2026 "As a CFI I really appreciate the 50% discount... ALL OF MY NEW STUDENTS WILL BE USING GP."
[I] CFI = right buyer with real routing agency, WRONG LTV (12-24 month career transit to the airlines).

## C. IS THE PROBLEM REAL? (demand-side)

### THE DEBRIEF GAP — REAL, CURRENT, BUT CAUSED BY PAY STRUCTURE
[C] AOPA 11 Feb 2026: "Too often in general aviation, this critical part of flight training is rushed, informal, or skipped altogether."
[C] Flying 1 Jun 2026 "The Art of the Pilot Debrief," subtitle "Don't rush the most important part of the flight" -- opens on an instructor whose "debriefs consisted of signing the logbook and saying, 'You did pretty good. See you next week,'" causing students to leave because they couldn't tell if they were "making progress."
[C] Student, verbatim: "We barely have time for any post-flight debrief. Both flights we landed and he was already late for the next student." / "The debrief is everything! And all I want is a little structure."
[C] **THE MECHANISM**, CFI verbatim: "I've seen lots of instructors get the student in the airplane, get the engine started, and then sit for 15 minutes doing a 'lesson brief'. With the engine running!! And all because THE INSTRUCTOR GOT PAYED MORE FOR FLIGHT THAN FOR GROUND."
[C] Corroborated: "My students didn't absorb the ground instruction when they felt like they were paying by the minute."
[C] SAFE: "The majority of educator input should happen in the debrief -- where 70-80% of all learning occurs."
[C] AOPA 2011 Flight Training Experience: 70-80% of student pilots never earn a certificate. COST WAS NOT STATISTICALLY SIGNIFICANT; educational quality, customer focus, community were. Largest gap: honesty/transparency 7.24 (completers) vs 6.32 (quitters). ~35% of instructors not rated sufficiently professional or as good teachers.
[C] COUNTER: Boldmethod's "11 Reasons Why Student Pilots Drop Out" lists finances, medicals, checkride failure, airsickness, the solo plateau -- NO mention of debriefs, feedback records, or instructor turnover.
[C] COUNTER: CFI review of CloudAhoy: "The app is very useful IF YOU HAVE TIME to debrief a flight with a student."
[C] FAA doctrine is PERMISSIVE: Aviation Instructor's Handbook says progress "may be recorded on a rubric." No per-lesson written debrief is required anywhere.
[I] LOAD-BEARING: the debrief gap is an INCENTIVE AND SCHEDULING problem, not a tooling problem. A product that ADDS post-flight CFI minutes fights the pay structure head-on; one that COMPRESSES them works with it. Hard design constraint.

### TURNOVER / HANDOFF — REAL AND QUANTIFIED, BUT MISDIAGNOSED
[C] Named costs: "I changed at 25 hours. Had to redo about 5 hours; the CFI had me repeat every single thing I'd done up till then." / "that used about a month and 18hrs of flight time to sort out." / "it's probably going to end up taking, I don't know, 25-30% more hour$." / "I had 3 different PPL instructors... the subsequent instructor always wanted me to repeat things to see where I stood. I can understand, but it sucked for me." / "Every time I built a rapport with my instructor, they hit their magic number and were off to the regionals. The replacement, and very green CFI would want to basically start at zero."
[I] Convergent: ~5 repeat hours typical, 18 worst case, 25-30% inflation for chronic switching. At ~$250-350/hr that is ~$1,250-1,750 per handoff.
[C] **THE CAUSE IS ENDORSEMENT LIABILITY, NOT LOST INFORMATION**: "it'll cost you some extra hours for the instructor to get a feel for your abilities BEFORE HE PUTS HIS NAME TO ANY ENDORSEMENTS. Figure 5hrs +/- extra."
[C] **THE WEDGE QUOTE** -- how handoffs work today: "Every instructor that has left our flight school SAT DOWN WITH THE NEW INSTRUCTOR who was going to take over and TALKED about where they left off, student's strengths and weakness, progress, and what still needs to be done." -- THE HANDOFF ARTIFACT IS A CONVERSATION. NOTHING IS WRITTEN DOWN.
[C] **THESIS-KILLING COUNTER-EVIDENCE**: "BECAUSE THE SCHOOL KEEPS SOLID RECORDS of each pilot's progress, it was a seamless flight." / Brad Z (CFI): "This happens all the time in structured training programs." / "No problem. Print off a syllabus and explain situation to instructors." / "Sportys have the Syllabus in the back of the training book." / An ENTIRE POA thread on switching CFIs in which NOBODY mentions records, syllabus, or cost -- it is purely about social awkwardness.
[C] Existing protocol: "PUT THEM ON THE PHONE TOGETHER." / "You will be responsible for managing the training plan."
[C] 14 CFR 141.77 caps transfer credit at 50% (approved course) / 25% (non-approved); receiving school MUST run its own proficiency tests. NO RECORD CAN REGULATE THAT AWAY.
[C] Turnover data: UND lost all but 2% of its 2015 CFI hires; Embry-Riddle "85 percent turnover"; average tenure at both "just 14 months" (2018). AOPA 2018: turnover "approximately nine months," "$1,650 for each new instructor."
[C] ALL HARD TENURE NUMBERS ARE 2018. [GAP] No authoritative 2023-2026 CFI-tenure statistic exists.
[C] 2026 CONTEXT CUTS AGAINST URGENCY: airline hiring has cooled (~8,000 hires, replacement-only); "Flight schools are no longer desperate for instructors."
[C] Schools' OWN remedy to turnover was "tightening up training programs to make sure instructors are teaching to consistent standards" -- STANDARDIZATION, a SUBSTITUTE for AfterFlight, not a complement.
[GAP] **THE SINGLE BIGGEST HOLE**: no retrievable quote from any pilot or CFI blames turnover for LOSING RECORDS. The stated cause is always the new CFI's unwillingness to sign without seeing the student fly.
[C] COUNTER: in a 24 May 2026 POA thread on declining student certificates, the explanation given is COST, not churn. Nobody blamed CFI turnover.

### WHO HOLDS THE RECORD TODAY
[C] LEGALLY REQUIRED: logbook time/route/conditions (61.51, STUDENT holds); instructor endorsement + signature (61.51(h)); CFI endorsement register 3 yrs (61.189, CFI PERSONALLY); TSA citizenship docs 5 yrs; graded chronological progress log ONLY under Part 141 (141.101, school holds, copy to student on request).
[C] **MANEUVER GRADES, DEBRIEF NOTES, NEXT-LESSON PLAN: REQUIRED BY NOBODY, HELD BY NOBODY.**
[C] The legally mandated record is a TIME-AND-SIGNATURE LEDGER, NOT A COMPETENCY RECORD.
[C] What is actually used, CFI verbatim: "I use a spreadsheet" / "Spreadsheet for me as well" / "I have a Google spreadsheet" / "I do a lesson sheet on a knee board. After the flight it goes in the students folder" / "Nope, simple entries in my normal logbook... This has worked just fine for me for the last 30 years."
[C] AskACFI 2013: "My fbo is pretty basic. I've got a paper folder for students... would like to see if there's an app or something more sophisticated available." THE IDEA IS 13+ YEARS OLD and was already attempted by a practitioner.
[C] FSP's own history: records are a "bookshelf stuffed full of binders"; progress on "massive paper grids called 'horse blankets'"; "for many owners, that's still the case."
[I] The training record is STRUCTURALLY WELDED TO SCHEDULING AND BILLING, because dispatch, Hobbs time, package drawdown and lesson completion are the same event. Displacement is implausible; attachment via the scheduling vendor's API is the only viable posture -- and they control the surface (see FSP closing its API).
[I] **THE ONE GENUINELY UNOWNED SLOT IS NARRATIVE DEBRIEF CONTENT** -- required by nobody, owned by nobody. That is the wedge; it is unowned because nobody has PAID for it, not because nobody noticed.

### DEMAND FOR AI DEBRIEF — SUPPLY IS RACING AHEAD OF AUDIBLE DEMAND
[C] ZERO organic posts on any reachable forum of the form "I wish my school had AI debrief."
[C] **COLD RECEPTION**: NextRating free CFI debrief app posted to POA Jun 2026 -> "Why not just put notes on a knee board?" Another demanded video demos and compared it unfavorably to CloudAhoy. NO AI MENTIONED ANYWHERE IN THE THREAD. Those CFIs already use ForeFlight tracklogs and CloudAhoy.
[C] A 29 Jul 2026 POA post pitching an ACS mock-oral tool drew ZERO REPLIES.
[C] **THE ONE UNSOLICITED PAIN AN AI DEBRIEF DIRECTLY RELIEVES**, Capterra FlightLogger review, Klaus M., Flight Instructor, 3 Jun 2025: "IT TAKES ME A LONG TIME TO DO THE DOCUMENTATION OF A FLIGHT." Unprompted, inside a review of a SCHEDULING product.
[C] Historical: SAFE's David St. George 2017 -- "Digital debrief is a flight training force multiplier!" -- noting it "was only available at the big sim centers like Flight Safety due to complexity and expense."
[C] "SOFTWARE FATIGUE" IS A VENDOR STORY, NOT A USER STORY: not one end-user post anywhere complaining about paying for 4 separate systems. Users complain their ONE tool is bad, or that vendors close their APIs.
[C] Incumbent satisfaction is real: "Flight circle is awesome, been using it for 6 years and they update it often."
[C] Adoption failure is at CFI level, not owner level. AOPA 2018: "There was a lot of resistance from much of the staff about adopting the syllabus and the associated paperwork." / "Many just opted to continue doing things the way they always had, so the simulator sat underutilized and the syllabus was overlooked." The owner ultimately REPLACED STAFF.
[C] Vendors PUBLICLY ARGUE AGAINST selling to small schools: "A solo CFI with one aircraft and five students does not need an operations management platform." / "A small Part 61 school with two aircraft, three instructors, and 20 students can function with a basic scheduling tool." / "the cheapest options are often sufficient." / "The overhead of a more sophisticated system would be wasted on an operation where THE OWNER CAN KEEP EVERY DETAIL IN THEIR HEAD."
[C] Every serious vendor has converged on the RECOVERED-BILLING-LEAKAGE ROI pitch ("$30,000-50,000/yr in unbilled flight time") because value selling does not land. [I] A DEBRIEF PRODUCT CANNOT MAKE THAT CLAIM.
[C] Cautionary tale: OpenAirplane/FlyOtto shut down 29 Dec 2019 -- operators reported over two years "only one or two customers used it." [I] Thousands of tiny operators signed one at a time, usage too thin to repay CAC.
[C] MyFBO closing 31 Aug 2026 after 25 years. Abrupt school closures 2024-2026: American Aviation (Ch.7, one student had paid $100k and received "only 3.5 hours"), Aviator College (nine days' notice), JC Air Academy (Ch.11 Aug 2026, five months after receiving FAA examining authority).

## D. REGULATORY & INSURANCE — TWO PREMISES IN THE BRIEF ARE WRONG

[C] **CORRECTION 1: INSURANCE IS SOFTENING, NOT SPIKING.** Hard market was 2019-2022. Flying May 2026: the market "began to level off in 2024 and has continued to STABILIZE AND SOFTEN through 2025 and now into 2026," with "broader underwriting appetites, more competitive pricing." Gallagher Q3 2025: "rates continue to SOFTEN across most segments." The "$8 billion 20-year high" Allianz figure is premium VOLUME, not a rate increase, and is widely miscited.
[C] **CORRECTION 2: THE FAA SMS RULE (14 CFR PART 5) DOES NOT COVER FLIGHT SCHOOLS.** 5.1 applies to Part 119 (121/135), 91.147 air tours, certain manufacturers. Parts amended: 5, 21, 91, 119 -- NOT 141.
[C] CORRECTION 3: the explicit debrief mandate ("Each training flight must include a preflight briefing and a postflight critique") appears in Part 141 Appendix A (RECREATIONAL pilot) but NOT Appendix B (PRIVATE pilot). DO NOT market a postflight critique as a universal Part 141 requirement.
[C] Insurance credits that DO exist: Avemco 5% WINGS + 5% training beyond FAA minimums = 10%, gated on "proof of completion" -- THE CREDIT ATTACHES TO THE ARTIFACT. USAIG 7.5% for annual recurrent w/ a qualified provider. Global Aerospace Vista Elite dividends up to 10.5% -- but TURBINE, PART 91 ONLY. Old Republic requires the application + instructor pilot forms for each instructor + YOUR SYLLABUS to be listed.
[C] Broker corroboration: schools with strong safety protocols see discounts "sometimes reducing total premium by 10-15%." Segment premium "$3,000 to $25,000" for a single-aircraft/few-instructor op.
[C] **THE STRONGEST TAILWIND -- FAA Docket FAA-2024-2531, Part 141 Modernization.** Public engagement complete, PRE-NPRM, no rule proposed. Docket closed 11 May 2026. FAA's own framing: part 141 "still has many foundational ties to Civil Air Regulations part 50, implemented in the 1940s"; modernization driven by "advances in technology and the need for data collection and analysis."
[C] The industry's own 471-page report (National Flight Training Alliance, docket comment FAA-2024-2531-0293) asks the FAA for:
 - Rec 9: "CENTRALIZE SOFTWARE AND RECORDKEEPING APPROVALS: Approve electronic recordkeeping systems and training software AT THE NATIONAL LEVEL."
 - An ACS-anchored 1-5 COMPETENCY SCALE where "a grade of 3 (Proficient)" maps to ACS pass tolerance -- "a logical 'Rosetta Stone' that allows binary and qualitative data to be converted into quantitative values."
 - "the FAA should develop a standardized technical 'crosswalk' protocol integrated into flight school management software... the FAA would provide an API or data-mapping schema" feeding a NATIONAL DATABASE for trend analysis.
 - "Standardization of data is critical to enabling aggregation and comparability across organizations."
[I] THE INDUSTRY HAS FORMALLY ASKED THE REGULATOR FOR EXACTLY THE ARTIFACT A DEBRIEF/CONTINUITY PRODUCT PRODUCES. That is the tailwind AND the clock: if rulemaking follows, structured digital training records shift from differentiator to TABLE STAKES.
[C] Other FINAL rules: MOSAIC effective 22 Oct 2025. **ACS INCORPORATED BY REFERENCE effective 31 May 2024 -- THE ACS IS NOW LEGALLY BINDING TEXT, NOT GUIDANCE.** CFI certificate expiration REMOVED effective 1 Dec 2024, replaced by recent-experience requirements [I] sleeper: CFI privileges now gate on a demonstrable RECORD, not a card. Falsification rule consolidation effective 3 Nov 2025, broadens falsification exposure.
[C] 14 CFR 141.79(d): every CFI assigned to a 141 course needs a course-objectives briefing, initial proficiency check in each make/model, and a recurrent check every 12 months -- the regulatory cost of every CFI departure.
[C] 14 CFR 141.5: schools must hold "a pass rate of 80 percent or higher on the first attempt."
[I] RETENTION INVERSION: the school's floor is 1 year (141.101(d)) while its individual CFIs' floor is 3 years (61.189) -- and liability exposure runs far longer than either.

## E. CONSENT / RECORDING RISK — ARCHITECTURE-DEPENDENT, NOT ABSOLUTE
[C] TWELVE all-party consent states (2026): CA, CT, DE, FL, IL, MD, MA, MT, NH, OR, PA, WA. Hybrid rules run the WRONG WAY: Oregon requires all-party consent for IN-PERSON ORAL communications while treating electronic as one-party.
[GAP] **DETERMINATIVE UNANSWERED QUESTION**: no case law, FAA counsel interpretation, or law-firm analysis of REASONABLE EXPECTATION OF PRIVACY INSIDE A GA COCKPIT exists in any accessible source. Closest analogue (Kilpatrick, Jul 2024): "A car would likely be considered a private space where participants could have a reasonable expectation of privacy, which would trigger applicable state two-party consent requirements."
[I] A two-seat cockpit with intercom-mediated speech between two known people is MORE private than a car. ASSUME REP ATTACHES. Wrinkle: an intercom tap arguably intercepts a WIRE communication as well as an ORAL one; ATC frequency has no REP but the hot-mic student/CFI conversation does -- TWO LEGALLY DISTINCT STREAMS IN ONE RECORDING.
[C] Self-generated data IS used against pilots: Trevor Jacob lost his certificate on his own published video. NTSB routinely recovers GoPro/VIRB from GA wrecks. "respondents in FAA enforcement actions do not have a right to invoke the Fifth Amendment." AOPA is lobbying on the analogous ADS-B issue (H.R. 4146 / S. 2175). Feb 2026 CVR rulemaking: "Commenters have expressed concern about the potential for disciplinary, punitive, and criminal actions as a result of capturing recording information."
[GAP] MEANINGFUL NEGATIVE: NO AOPA / Pilot Protection Services / NAFI / SAFE publication warns pilots or CFIs about self-recorded cockpit audio. AOPA counsel treats self-generated data as a DEFENSIVE asset.
[I] THE REAL RISK VECTOR IS CIVIL, NOT REGULATORY: a privately held archive is ordinary third-party evidence with FEWER protections than a certified CVR -- a wrongful-death plaintiff subpoenaing a school's recording archive.
[C] Community sentiment mostly permissive with a REAL MINORITY VETO: "There are zero reg's against it. I actually had a CFI who bought a GoPro for the sole reason of being able to film his lessons" / "If your CFI doesn't want to record it, find another CFI." Against: "more likely he doesn't want his instructing critiqued on the internet" / "Filming in the cockpit is distracting and unsafe" / "I only had one CFI that didn't want it on." Norm: "the CFI should have the final say if he's against it -- both would have to agree."
[C] CFI: "I find it a great debriefing tool and particularly useful if they are learning to use the radio."
[GAP] No NAFI/SAFE policy on recording lessons exists -- no standard to comply with, and none to hide behind.
[C] LEGAL ACCEPTABILITY IS EMPIRICALLY DEMONSTRATED INSTITUTIONALLY: Navi records cockpit audio in production across multiple states w/ United Airlines Ventures + DoD money and NO visible legal incident -- BECAUSE IT SELLS TO SCHOOLS. Its customer is the school, not the student.
[I] **CONSENT IS NOT A KILLER FOR B2B2C SOLD THROUGH SCHOOLS -- the institutional GTM *IS* the consent architecture** (school employs the CFI and enrolls the student; consent becomes an enrollment/employment document). It is CLOSE TO FATAL DIRECT-TO-STUDENT, where the student unilaterally records a third party's employee across a 12-state minefield, with a CFI veto ~1 in 5 will exercise.
[S] "THE STUDENT OWNS THE RECORD" *INVERTS* THE WORKABLE CONSENT STRUCTURE: a student-portable, exportable recording of a named CFI's teaching performance is precisely what the resistant CFIs named.

## F. HAS ANYONE EVER MONETIZED A USER-OWNED RECORD? — NO
[I] Across THIRTEEN documented cases, no individual has ever paid meaningful money for custody of their own record. Every commercial success monetized something ADJACENT.
| Case | Worked? | Who actually paid | Monetized the record? |
| MyFlightbook | product yes, business no | donors ("we don't try to make money") | No |
| ForeFlight Logbook | yes, as retention glue | pilot -- for CHARTS | No |
| LogTen | standalone; ACQUIRED BY FLIGHT SCHEDULE PRO May 2022 | pilot $80-130/yr | absorbed into school ops software |
| FAA Pilot Records Database | yes -- MANDATED | taxpayer/employers | No; "pilot consent is time-limited" FORECLOSES selling records to airlines |
| Google Health | FAILED 2011 | nobody | No |
| Microsoft HealthVault | FAILED, data deleted Nov 2019 | nobody | No |
| PicnicHealth | survives | PHARMA (free for patients in studies) | No |
| Ciitizen | $325M exit -> ACQUIRER BANKRUPT 2024 | Invitae, mostly in doomed stock | No |
| Blue Button / Apple Health | policy success | govt / hardware margin | No |
| **Parchment** | **YES -- $835M** | **15,000 INSTITUTIONS** | transaction TOLL, not the record |
| Credly | modest -- $13.3M revenue on 48M badge-holders = **$0.28 each** | ISSUERS | No |
| Blockcerts/Learning Machine -> Hyland | DISCONTINUED | nobody | No |
| Strava | yes ~$490M ARR | **2% of users**, for SOCIAL features | No -- GPX given away |
[C] Diagnosis on HealthVault's failure: "these portals were not really designed by determining what type of information would help the patient and the physician; THEY WERE JUST OFFERED AS A PLACE TO STORE DATA."
[I] Strava is the only consumer win and it does NOT transfer: it monetizes comparison and social identity. Student pilots number in the low hundreds of thousands, train 12-18 months, and have every incentive NOT to publish their worst moments.
[I] PREDICTION: the school buys; portability to the student is a FREE TRUST FEATURE that reduces friction, not a revenue line.

## G. VERIFIED-UNCLAIMED TERRITORY (nobody in the entire scan does these)
1. **AI AUDIO RECAP OF THE DEBRIEF.** Every competitor uses audio as INPUT. Zero produce audio OUTPUT. (FlightSense deletes the local audio after processing; Navi outputs text/visuals/animations; Atlas outputs a text page.)
2. **SELF-ASSESSMENT vs CFI-ASSESSMENT DISCREPANCY DETECTION.** Nobody. FlightSense captures both and never diffs them. Atlas holds both data sides and never connects them. BOTH ARE ONE FEATURE AWAY.
3. **RECURRING WEAKNESS DETECTION ACROSS DIFFERENT INSTRUCTORS.** Nobody. (FlightSense does multi-lesson over a 15-log window with no instructor dimension.)
4. **A TRUE SYNTHESIZED "WHAT SHOULD THE NEXT CFI KNOW" BRIEF.** Wingman NAMES it without a CFI in the loop; Atlas SHARES A PAGE to "their next CFI." Neither SYNTHESIZES.
5. **STUDENT-OWNED LONGITUDINAL RECORD PORTABLE ACROSS SCHOOLS.** Atlas made it CFI-owned; Navi and FlightSense made it SCHOOL-owned. (But see section F -- unclaimed because unmonetizable.)
CONTESTED / NOW OCCUPIED: debrief-quality scoring and CFI-performance-from-debrief analytics are BOTH SHIPPED BY FLIGHTSENSE. Do not treat these as white space. (One research agent reported them unclaimed but had not examined FlightSense; the doc-cited finding wins.)
