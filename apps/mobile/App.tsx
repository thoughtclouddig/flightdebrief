import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Device from "expo-device";
import { c, s } from "./src/theme";
import { Label, Panel, PrimaryButton, Row, SecondaryButton, Title } from "./src/screens/ui";
// Importing for the side effect: the background task must be registered at
// module scope so an iOS background relaunch finds a handler waiting.
import {
  isRecording,
  requestPermissions,
  startRecording,
  stopRecording,
  type PermissionOutcome,
} from "./src/recorder";
import { countFixes, getActiveSession, type LocalSession } from "./src/db/sessions";
import { endRemoteSession, getToken, saveToken, startRemoteSession, syncPending } from "./src/api/client";

type Screen = "signin" | "ready" | "active" | "complete" | "recover";

/**
 * The whole POC.
 *
 * Five screens and one job: prove that a phone can record a flight with the
 * screen locked and ForeFlight open, offline, and that the result lands in the
 * existing web Flight Replay. Everything else stays on the web for now.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [session, setSession] = useState<LocalSession | null>(null);
  const [fixes, setFixes] = useState(0);
  const [permission, setPermission] = useState<PermissionOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncNote, setSyncNote] = useState("Saved on device");
  const [solo, setSolo] = useState(false);

  // On launch: signed in? and did a previous session survive an OS kill?
  useEffect(() => {
    (async () => {
      const token = await getToken();
      const active = await getActiveSession();
      if (active) {
        setSession(active);
        setFixes(await countFixes(active.id));
        // Recording still running means we were merely backgrounded; stopped
        // means the process was killed and this is a recovery.
        setScreen((await isRecording()) ? "active" : "recover");
        return;
      }
      setScreen(token ? "ready" : "signin");
    })();
  }, []);

  // Elapsed time and fix count while active. One second is enough -- there is
  // nothing on this screen worth watching more closely than that.
  useEffect(() => {
    if (screen !== "active" || !session) return;
    const id = setInterval(async () => setFixes(await countFixes(session.id)), 1000);
    return () => clearInterval(id);
  }, [screen, session]);

  const begin = useCallback(async () => {
    setBusy(true);
    try {
      const outcome = await requestPermissions();
      setPermission(outcome);
      if (outcome === "denied") return;

      // t0 is the tap. Not the first fix, not the server's clock.
      const t0 = Date.now();
      const id = `s-${t0}`;
      await startRecording({
        sessionId: id,
        t0,
        aircraftTail: "N4521P",
        aircraftType: "C172S",
        instructor: solo ? null : "Jake Alvarez",
        flightType: solo ? "solo" : "instructor",
      });
      const local = await getActiveSession();
      setSession(local);
      setScreen("active");

      // Best effort. A student on a ramp with no signal still flies.
      try {
        if (local) {
          await startRemoteSession(local, {
            platform: "ios",
            model: Device.modelName ?? null,
            appVersion: "0.1.0",
          });
          setSyncNote("Synced");
        }
      } catch {
        setSyncNote("Saved on device · will sync later");
      }
    } finally {
      setBusy(false);
    }
  }, [solo]);

  const end = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      const endedAt = Date.now();
      await stopRecording(session.id, endedAt);
      setScreen("complete");
      setSyncNote("Syncing…");
      try {
        // Drain every pending batch, then finalize. Order matters: the flight's
        // duration is computed server-side from the fixes it has.
        for (;;) {
          const { done } = await syncPending(session.id);
          if (done) break;
        }
        await endRemoteSession(session.id, endedAt, session.aircraftType);
        setSyncNote("Flight Replay ready");
      } catch {
        setSyncNote("Saved on device · will sync when you're back online");
      }
    } finally {
      setBusy(false);
    }
  }, [session]);

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={st.scroll}>
        {screen === "signin" ? (
          <>
            <Title>Sign in</Title>
            <Text style={st.body}>
              Use the same AfterFlight account you use on the web. Your flights, debriefs and progress are the same
              record.
            </Text>
            {/* The POC accepts a token pasted from the web session. Full OIDC
                on device is the next step and is not what this build is
                trying to prove. */}
            <PrimaryButton label="Continue" onPress={async () => { await saveToken("dev-token"); setScreen("ready"); }} />
          </>
        ) : null}

        {screen === "ready" ? (
          <>
            <Label>Before engine start</Label>
            <Title>Ready to fly?</Title>
            <View style={st.card}>
              <Row label="Aircraft" value="C172S · N4521P" />
              <Row label="Departing" value="KSQL" />
              <Row label="Flying with" value={solo ? "Solo" : "Jake Alvarez"} />
            </View>
            <SecondaryButton label={solo ? "With an instructor" : "Solo — no instructor"} onPress={() => setSolo(!solo)} />
            {/* Said before the tap. A student who is told nothing and comes
                back to a partial track cannot re-fly the lesson. */}
            <Text style={st.note}>
              AfterFlight uses your location only while a flight is recording, to build your flight path and replay.
              It stops the moment you end the flight.
            </Text>
            {permission === "foreground-only" ? (
              <Text style={st.warn}>
                Background location is off, so recording will pause when the screen locks. You can change this in
                Settings.
              </Text>
            ) : null}
            {permission === "denied" ? (
              <Text style={st.warn}>Location is off, so there&apos;s no track to record. Add the flight afterwards instead.</Text>
            ) : null}
            <PrimaryButton label="Start flight" onPress={begin} busy={busy} />
          </>
        ) : null}

        {screen === "active" && session ? (
          <>
            {/* Deliberately almost empty. No telemetry, no map, no coaching --
                nothing that rewards looking at the phone. */}
            <Panel style={st.activePanel}>
              <Text style={st.recording}>RECORDING</Text>
              <Elapsed t0={session.t0} />
              <Text style={st.panelMeta}>
                {session.aircraftType} · {session.aircraftTail} · {session.instructor ?? "Solo"}
              </Text>
              <Text style={st.panelMeta}>{fixes > 0 ? `${fixes} fixes recorded` : "Waiting for GPS"}</Text>
              <Text style={st.panelMeta}>{syncNote}</Text>
            </Panel>
            <Text style={st.body}>You can lock your phone or open ForeFlight.</Text>
            <SecondaryButton label="End flight" onPress={end} />
          </>
        ) : null}

        {screen === "complete" && session ? (
          <>
            <Panel>
              <Text style={st.recording}>FLIGHT COMPLETE</Text>
              <Text style={st.panelTitle}>{fixes} fixes recorded</Text>
              <Text style={st.panelMeta}>{syncNote}</Text>
            </Panel>
            <PrimaryButton label="Start debrief on the web" onPress={() => setScreen("ready")} />
            <SecondaryButton label="Done" onPress={() => setScreen("ready")} />
          </>
        ) : null}

        {screen === "recover" && session ? (
          <>
            <Label>On relaunch</Label>
            <Title>Recording was interrupted</Title>
            <Text style={st.body}>
              We recovered {fixes} fixes recorded before AfterFlight stopped. The gap while it was closed
              can&apos;t be recovered — iOS does not hand back the fixes taken while no handler was running.
            </Text>
            <PrimaryButton
              label="Resume recording"
              onPress={async () => {
                await startRecording({
                  sessionId: session.id,
                  t0: session.t0,
                  aircraftTail: session.aircraftTail,
                  aircraftType: session.aircraftType,
                  instructor: session.instructor,
                  flightType: session.flightType,
                });
                setScreen("active");
              }}
            />
            <SecondaryButton label="End flight" onPress={end} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Elapsed({ t0 }: { t0: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.max(0, Math.round((now - t0) / 1000));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return <Text style={st.clock}>{`${hh}:${mm}:${ss}`}</Text>;
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.canvas },
  scroll: { padding: s.lg, gap: s.md },
  body: { fontSize: 17, lineHeight: 26, color: c.textSoft },
  note: { fontSize: 13, lineHeight: 20, color: c.textFaint },
  warn: { fontSize: 15, lineHeight: 22, color: c.attention },
  card: { backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.hairline, paddingHorizontal: s.md },
  activePanel: { alignItems: "center", gap: s.md, paddingVertical: s.xl },
  recording: { fontSize: 13, fontWeight: "700", letterSpacing: 1.6, color: c.brand },
  clock: { fontSize: 52, fontWeight: "600", color: c.panelText, fontVariant: ["tabular-nums"] },
  panelTitle: { fontSize: 26, fontWeight: "600", color: c.panelText },
  panelMeta: { fontSize: 15, color: c.panelTextSoft },
});
