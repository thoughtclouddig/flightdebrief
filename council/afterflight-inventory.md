# AfterFlight — verified build state (from source, Aug 2026)

Verified by reading the repo, not the pitch. LIVE = code + DB + route ships today.

## LIVE (shipped, in the running product)
- Voice debrief capture (guided recorder), consent-gated; Deepgram transcription with word timestamps + speaker diarization.
- Claude analysis pipeline -> structured result: whatWeDid, wentWell, needsWork, instructorGuidance (attributed quotes), actionItems, nextLessonFocus, studyReferences, nextFlightCue (+cue context), narrativeRecap.
- Debrief Replay: TTS audio recap (Deepgram TTS), cached, ICAO-style number phraseology, second-person rewriting, explicit CFI attribution, solo-vs-student narration split.
- Student self-assessment AND instructor assessment, CFI-first sequencing enforced, per-ACS-task performance levels.
- **Discrepancy detection is LIVE**: lib/debrief-cards/discrepancy.ts computes rank distance between student and CFI ratings -> none/minor/significant; surfaced on a dedicated /compare route + AssessmentDifference type. Deterministic, not LLM-guessed.
- **Instructor handoff brief is LIVE**: /cfi/students/[id]/handoff, powered by computeNextLessonBrief().
- **Study-resource open tracking is LIVE**: study_resource_views table + per-student index.
- **Training signals taxonomy is LIVE**: training_signals table carries student_id, INSTRUCTOR_ID, aircraft_id, flight_id, skill, category, status(NEEDS_WORK|IMPROVING), source(STUDENT|INSTRUCTOR|STUDENT_AND_INSTRUCTOR), per-signal statement.
- Recurring themes: computeRecurringThemes() over recent signals -> theme + skill + count + consideredFlights.
- Next-Lesson Brief (student) + Handoff (CFI) from ONE function: last flight, last debrief, last instructor note, unfinished training items (keep_working_on / before_next_flight), focus areas, recurring themes, upcoming reservation, suggested question.
- Action-item auto-resolve across lessons (lib/action-items-autoresolve.ts) = unfinished business carried forward.
- Training history timeline, skill progress, FlightScore gauge (honest-unavailable state).
- School-level aggregation: lib/training-insights.ts + /admin/insights.
- Multi-org membership + switcher, invite flows, Stripe billing live, entitlements/billing gate.
- Radio practice module (scenario bank, scoring, AI judge, radio audio effect).
- Content/SEO engine: AI-drafted resource articles w/ human review + publish guard, AI-discovery layer.
- Super-admin: schools, subscribers, content, AI referrals.

## PARTIAL / structurally present but not surfaced as a product story
- Cross-INSTRUCTOR recurrence: training_signals stores instructor_id per signal, so "this appeared in 3 lessons with 2 different CFIs" is computable TODAY, but computeRecurringThemes() aggregates by skill only and does not count distinct instructors. This is the "Continuity Graph" and it is ~80% built at the data layer.
- Flight telemetry: flight-data + flight-tracking abstractions exist, FR24 integration; NOT maneuver analysis or telemetry scoring.
- Scheduling: reservations exist (school orgs); not a dispatch/billing/maintenance system.

## NOT BUILT (concept only)
- Debrief quality scoring (evaluating the debrief itself: "ADM not discussed").
- CFI/instructor development analytics from debrief content.
- Student-owned record portable across schools (data model is org-scoped; multi-membership exists but there is no export/port-out).
- Any Part 141 recordkeeping, maintenance, dispatch, or full ERP surface.

## Founder-stated features that are ALREADY LIVE (do not treat as roadmap)
Items 1-12 of the founder's workflow are all live. The "potential white space" items A (continuity graph), B (perception gap), C (next-CFI brief), D (training memory) are substantially BUILT, not aspirational. E (debrief quality), F (instructor development), G (student-owned record) are genuinely unbuilt.
