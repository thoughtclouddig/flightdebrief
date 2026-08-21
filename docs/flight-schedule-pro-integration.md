# Flight Schedule Pro integration (cataloged, not scheduled)

A future add-on: let a CFI schedule the next lesson from AfterFlight and have
it push into Flight Schedule Pro (FSP), instead of scheduling twice -- once
in AfterFlight (the new manual scheduler for `individual`/`independent_cfi`
orgs, see `components/schedule-lesson-form.tsx`) and again in FSP for schools
that already run it. Cataloged here on request; not started.

## What already exists to build on

- `lib/scheduling/types.ts`'s `SchedulingProvider` interface -- `getStudents`,
  `getInstructors`, `getAircraft`, `getReservations`, `getFlights`.
- `lib/scheduling/mock-provider.ts` -- the only implementation today, returns
  hardcoded seed reservations.
- `lib/scheduling/index.ts`'s `getSchedulingProvider()` -- already has the
  intended real-provider branch, currently a deliberate throw:
  `"FlightScheduleProProvider is not implemented yet -- unset
  FLIGHT_SCHEDULE_PRO_API_KEY to use the mock provider."`
- `Repository.createReservation` (added this session, see
  `lib/data/postgres-repository.ts`) -- already the exact shape a "push to
  FSP" write would build on: it takes `{organizationId, studentId,
  instructorId, aircraftId, scheduledStart, scheduledEnd}` and writes an
  app-originated reservation. A real integration reuses this unchanged for
  the AfterFlight-side write; the new work is calling FSP's API afterward
  (or via a webhook/sync job) and recording the returned FSP booking id in
  the already-present `reservations.external_provider` /
  `reservations.external_id` columns.

Net: most of the plumbing for *reading* FSP data into this shape already
exists as scaffolding. The genuinely new work is authenticating against FSP
and calling its real endpoints, and the *write* (push) direction specifically
hasn't been implemented or verified against FSP's actual API.

## What Flight Schedule Pro's API actually offers

Confirmed via their public developer portal (`developer.flightschedulepro.com`):

- A real, dedicated developer portal with two documented API surfaces: a
  **Core API** (`api.flightschedulepro.com`) and a **Scheduling API**
  (`usc-api.flightschedulepro.com/scheduling/v1.0`) -- this is a legitimate,
  maintained API, not a rumor or a partner-only backchannel.
- **Access is gated, not self-serve.** Their own marketplace page states the
  API is available "on a by-request basis" -- contact their team to discuss
  access. There's no public signup/API-key flow.
- The detailed endpoint reference (auth method, whether the Scheduling API
  supports *writing* a new reservation vs. only reading, required fields,
  rate limits) sits behind that gated access -- it could not be confirmed
  from the public pages. **This is the one open question that actually
  matters**: if their API only supports reading schedules, not creating
  bookings, the "push a new lesson to FSP" half of this feature isn't
  buildable as scoped and would need a different approach (e.g. surfacing an
  AfterFlight-originated reservation for the CFI to manually confirm inside
  FSP, rather than a true push).

## The real first step

This is a **business step before an engineering one**: contact Flight
Schedule Pro's partnerships team to (a) get API access at all, and (b)
specifically confirm the Scheduling API supports creating a reservation, not
just reading. Their existing marketplace partners (LogTen, QuickBooks
Online, Google Calendar, Sallie Mae, Edly, Sporty's, Wings Leasing) don't
include any training-records/debrief competitor or precedent to infer the
answer from.

## Rough shape, once access + write capability are confirmed

1. Implement `FlightSchedulePro implements SchedulingProvider` in
   `lib/scheduling/`, replacing the throw in `getSchedulingProvider()`.
2. Add the FSP-side create-booking call, invoked right after
   `Repository.createReservation` succeeds in `app/api/reservations/route.ts`
   -- store the returned FSP id in `externalProvider`/`externalId`.
3. Decide read-sync direction too (should FSP-originated reservations flow
   back into AfterFlight, and how often/via webhook vs. polling) -- currently
   out of scope for this catalog entry, flagged for the same conversation.
4. Once this exists, `components/student-training-detail.tsx`'s
   `canScheduleLessons` gate (currently `org.kind !== "school"`, added to
   avoid duplicate/unsynced scheduling for FSP-using schools) should flip to
   checking whether the org has an active FSP connection, not just its kind
   -- schools *without* FSP should still get the manual scheduler.
