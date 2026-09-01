import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createLocalSession, endLocalSession, getActiveSession, insertFix } from "./db/sessions";

/**
 * The background recorder.
 *
 * This is the whole reason the native app exists. Everything else here could
 * live on the web; nothing else can do this.
 *
 * The task is registered at module scope, not inside a component. iOS relaunches
 * the app into the background to deliver location updates, and at that moment no
 * React tree exists -- if registration were in a `useEffect`, the update would
 * arrive with no handler and the fix would be dropped silently. That is the
 * classic way background tracking "mostly works" and then loses the middle of a
 * flight.
 */
export const LOCATION_TASK = "afterflight-location";

interface LocationTaskData {
  locations: Location.LocationObject[];
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = (data ?? {}) as LocationTaskData;
  if (!locations?.length) return;

  // Read the session on every delivery rather than closing over it: after a
  // background relaunch this module is fresh and any captured value is gone.
  const session = await getActiveSession();
  if (!session) return;

  for (const loc of locations) {
    await insertFix(session.id, {
      nativeTimestamp: loc.timestamp,
      // Relative to the START FLIGHT tap. The shared clock the web replay,
      // and later cockpit audio and video, all stamp against.
      t: loc.timestamp - session.t0,
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      // `?? null` and never `?? 0`. A device that does not report altitude
      // reports nothing, and a zero would read as sea level.
      altitudeM: loc.coords.altitude ?? null,
      accuracyM: loc.coords.accuracy ?? null,
      altitudeAccuracyM: loc.coords.altitudeAccuracy ?? null,
      // Expo calls it `heading`; Core Location calls it course. It is course
      // over ground, and the rename happens here so the misnomer travels no
      // further -- in a crosswind the difference is the entire lesson.
      courseDeg: loc.coords.heading ?? null,
      // Metres per second over the ground. Never indicated airspeed.
      speedMps: loc.coords.speed ?? null,
    });
  }
});

export type PermissionOutcome = "granted" | "foreground-only" | "denied";

/**
 * Ask for location, in context and in order.
 *
 * Foreground first, then background, and only after the student has tapped
 * START FLIGHT. iOS will not grant Always on a cold prompt with no
 * justification, and asking at signup -- before the app has done anything --
 * is how an app gets denied permanently by a user who has no idea why it is
 * asking.
 *
 * Foreground-only is a real, usable outcome: recording works while the screen
 * is on. The caller says so plainly rather than failing.
 */
export async function requestPermissions(): Promise<PermissionOutcome> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return "denied";
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === "granted" ? "granted" : "foreground-only";
}

export interface StartOptions {
  sessionId: string;
  t0: number;
  aircraftTail: string;
  aircraftType: string | null;
  instructor: string | null;
  flightType: "instructor" | "solo";
}

export async function startRecording(opts: StartOptions): Promise<void> {
  await createLocalSession({
    id: opts.sessionId,
    t0: opts.t0,
    aircraftTail: opts.aircraftTail,
    aircraftType: opts.aircraftType,
    instructor: opts.instructor,
    flightType: opts.flightType,
    startedAt: opts.t0,
  });

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    // Pattern work needs enough resolution to reconstruct approaches, and
    // this is the only setting that keeps the GPS chip fully awake in the
    // background. Battery cost is real and measured on device, not guessed at
    // here -- optimising before measuring would be tuning blind.
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    // 0, not a distance filter. A distance filter would drop the samples
    // taken while holding short or in the flare -- exactly the moments the
    // debrief is about.
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    // iOS: keeps the blue bar visible so the student always knows.
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.OtherNavigation,
    // Android requires a visible foreground service. Not a workaround --
    // the notification is the platform's contract with the user, and it is
    // also the fastest way back into the app.
    foregroundService: {
      notificationTitle: "AfterFlight is recording your flight",
      notificationBody: "Tap to return to the active flight.",
      notificationColor: "#f07621",
    },
  });
}

/**
 * Stop, immediately.
 *
 * High-accuracy background location must not outlive the session that
 * justified asking for it -- both because it is the student's battery and
 * because passive tracking is not something this product does.
 */
export async function stopRecording(sessionId: string, endedAt: number): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  await endLocalSession(sessionId, endedAt);
}

/** Whether the OS still has us recording. Used by the recovery screen. */
export async function isRecording(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
}
