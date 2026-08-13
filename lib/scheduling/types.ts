import type { Aircraft, Reservation, User } from "@/lib/types";

/**
 * Abstraction over any external scheduling/dispatch system. Flight Schedule
 * Pro is the eventual real implementation; MockSchedulingProvider backs the
 * prototype. Scheduling tells us *who is supposed to fly and when* --
 * separate from FlightDataProvider (lib/flight-data), which tells us what an
 * aircraft actually did in the air. This app never writes to a
 * SchedulingProvider, only reads from it.
 */
export interface SchedulingProvider {
  readonly name: string;
  getStudents(organizationId: string): Promise<User[]>;
  getInstructors(organizationId: string): Promise<User[]>;
  getAircraft(organizationId: string): Promise<Aircraft[]>;
  getReservations(organizationId: string): Promise<Reservation[]>;
  /** Flight records the scheduling system already has, where available. Reserved -- not called by the prototype yet. */
  getFlights(organizationId: string): Promise<unknown[]>;
}
