import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import {
  acknowledgeBatch,
  markBatchSent,
  nextPendingBatch,
  releaseBatch,
  setRemoteIds,
  type LocalFix,
  type LocalSession,
} from "../db/sessions";

/**
 * The client for the versioned mobile ingestion API.
 *
 * Every call here is optional to the recording. The phone records to SQLite
 * regardless, and sync is a separate concern that catches up when there is
 * signal -- so a failure in this file never costs a flight.
 */
const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? "https://getafterflight.com";
const TOKEN_KEY = "afterflight.session";

/**
 * SecureStore, not AsyncStorage. The session JWT is a bearer credential; on
 * iOS this puts it in the Keychain, where a device backup or a filesystem dump
 * does not hand it over in plain text.
 */
export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("not signed in");
  const res = await fetch(`${BASE}/api/mobile/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    await clearToken();
    throw new Error("session expired");
  }
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

export async function startRemoteSession(s: LocalSession, device: { platform: "ios" | "android"; model: string | null; appVersion: string }) {
  const out = await post<{ sessionId: string }>("/flights/start", {
    sessionId: s.id,
    // The tap, not the request. Sending the request time would shift every
    // fix by however long the phone spent waiting for signal.
    t0: s.t0,
    aircraftTail: s.aircraftTail,
    device,
  });
  await setRemoteIds(s.id, out.sessionId, null);
  return out;
}

/**
 * Push whatever is pending, one bounded batch at a time.
 *
 * The idempotency key is derived from the session and the batch's first and
 * last `t` -- deterministic, so a retry after a crash regenerates the SAME key
 * for the same fixes and the server recognizes it. A random key would make
 * every retry a new batch and defeat the whole mechanism.
 */
export async function syncPending(sessionId: string): Promise<{ sent: number; done: boolean }> {
  const fixes: LocalFix[] = await nextPendingBatch(sessionId);
  if (fixes.length === 0) return { sent: 0, done: true };

  const key = `${sessionId}:${fixes[0]!.t}-${fixes[fixes.length - 1]!.t}`;
  await markBatchSent(sessionId, key, fixes);
  try {
    await post(`/flights/${sessionId}/telemetry`, { idempotencyKey: key, fixes });
    // Only now. Marking acknowledged on send would mean a response lost in
    // the air silently discards fixes that never arrived.
    await acknowledgeBatch(key);
    return { sent: fixes.length, done: false };
  } catch (e) {
    await releaseBatch(key);
    throw e;
  }
}

export async function endRemoteSession(sessionId: string, endedAt: number, aircraftType: string | null) {
  const out = await post<{ flightId: string; trackedMs: number }>(`/flights/${sessionId}/end`, {
    endedAt,
    aircraftType,
  });
  await setRemoteIds(sessionId, null, out.flightId);
  return out;
}

export async function recover() {
  return post<{ active: { sessionId: string; fixesOnServer: number } | null }>("/flights/recover", {});
}
