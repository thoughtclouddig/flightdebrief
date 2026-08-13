import type { Aircraft, Reservation, User } from "@/lib/types";
import {
  ORG_FALCON,
  SEED_AIRCRAFT as DA40_N123AB,
  USER_ANDY,
  USER_DANNY,
  USER_MARIA,
  USER_SARAH,
} from "@/lib/data/seed";
import type { SchedulingProvider } from "./types";

const SARAH_AIRCRAFT: Aircraft = {
  id: "aircraft-c172-n731sp",
  tailNumber: "N731SP",
  type: "Cessna 172",
  make: "Cessna",
  model: "172",
  homeAirport: "KCHD",
  organizationId: ORG_FALCON.id,
  status: "active",
  externalProvider: "mock_scheduling",
  externalId: "sched-aircraft-2",
};

function todayAt(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Stands in for Flight Schedule Pro. Returns the same today's lessons the
 * app is already seeded with -- in a real integration this data would come
 * from FSP's API instead of our own seed, and a sync step would write
 * Reservation rows into the repository from here.
 */
export class MockSchedulingProvider implements SchedulingProvider {
  readonly name = "mock";

  async getStudents(organizationId: string): Promise<User[]> {
    if (organizationId !== ORG_FALCON.id) return [];
    return [USER_ANDY, USER_SARAH];
  }

  async getInstructors(organizationId: string): Promise<User[]> {
    if (organizationId !== ORG_FALCON.id) return [];
    return [USER_DANNY, USER_MARIA];
  }

  async getAircraft(organizationId: string): Promise<Aircraft[]> {
    if (organizationId !== ORG_FALCON.id) return [];
    return [DA40_N123AB, SARAH_AIRCRAFT];
  }

  async getReservations(organizationId: string): Promise<Reservation[]> {
    if (organizationId !== ORG_FALCON.id) return [];
    return [
      {
        id: "sched-reservation-andy-today",
        organizationId,
        studentId: USER_ANDY.id,
        instructorId: USER_DANNY.id,
        aircraftId: DA40_N123AB.id,
        scheduledStart: todayAt(15, 0),
        scheduledEnd: todayAt(16, 30),
        status: "scheduled",
        externalProvider: "mock_scheduling",
        externalId: "sched-res-1",
      },
      {
        id: "sched-reservation-sarah-today",
        organizationId,
        studentId: USER_SARAH.id,
        instructorId: USER_DANNY.id,
        aircraftId: SARAH_AIRCRAFT.id,
        scheduledStart: todayAt(17, 30),
        scheduledEnd: todayAt(19, 0),
        status: "scheduled",
        externalProvider: "mock_scheduling",
        externalId: "sched-res-2",
      },
    ];
  }

  async getFlights(): Promise<unknown[]> {
    return [];
  }
}
