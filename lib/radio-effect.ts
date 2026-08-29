"use client";

/**
 * Makes a TTS-generated ATC call sound like it's actually coming over a
 * VHF radio instead of a clean narrator voice: band-limits the voice to
 * roughly the intelligible speech range a real aircraft radio reproduces,
 * adds a touch of clipping/compression, and layers in a quick squelch
 * click plus a thin bed of static. Applied client-side at playback time
 * (Web Audio), not baked into the cached TTS audio server-side, so the
 * same cached file can be reused as-is if the effect is ever tuned.
 */

function makeSoftClipCurve(amount: number): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function createStaticBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function scheduleSquelchClick(ctx: AudioContext, destination: AudioNode, when: number): void {
  const clickBuffer = createStaticBuffer(ctx, 0.06);
  const source = ctx.createBufferSource();
  source.buffer = clickBuffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
  source.connect(gain).connect(destination);
  source.start(when);
  source.stop(when + 0.07);
}

export interface RadioEffectHandle {
  stop(): void;
}

/**
 * Plays `audioUrl` through the radio-effect chain. Resolves once playback
 * finishes naturally; call `.stop()` on the returned handle to cut it off
 * early. Each call builds its own AudioContext/element -- infrequent,
 * short one-off playback, not worth the complexity of a shared/reusable
 * graph.
 */
/**
 * Controllers talk faster than a TTS narrator.
 *
 * Deepgram reads at an even, explanatory pace, which is the wrong register
 * for a clearance: a student who only ever hears a call at narration speed is
 * unprepared for the real one, and the practice teaches the wrong expectation.
 * 1.18 lands close to a busy-but-not-rushed controller without the chipmunk
 * artefacts that start around 1.3.
 */
const ATC_PLAYBACK_RATE = 1.18;

export function playWithRadioEffect(audioUrl: string): { finished: Promise<void>; handle: RadioEffectHandle } {
  const audioEl = new Audio(audioUrl);
  audioEl.playbackRate = ATC_PLAYBACK_RATE;
  // Keeps the pitch where it belongs while the rate goes up -- without this,
  // faster playback raises the voice and it stops sounding like a controller.
  audioEl.preservesPitch = true;
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioContextCtor();

  const source = ctx.createMediaElementSource(audioEl);
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  // A real aircraft radio is narrower than this filter used to be: 300-3000Hz
  // still passes enough low end and sibilance to sound like a clean recording
  // with a mild filter on it. The band a VHF set actually reproduces is
  // tighter, and tightening it is most of what makes the effect audible.
  highpass.frequency.value = 400;
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 2600;
  const shaper = ctx.createWaveShaper();
  // Float32Array's generic buffer type doesn't structurally match
  // WaveShaperNode.curve's expected ArrayBuffer-backed variant in this
  // lib.dom.d.ts version even though the runtime value is fine -- cast.
  shaper.curve = makeSoftClipCurve(22) as Float32Array<ArrayBuffer>;
  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 1.15;

  source.connect(highpass).connect(lowpass).connect(shaper).connect(voiceGain).connect(ctx.destination);

  // Thin static bed under the voice for the whole call -- a short looped
  // buffer works fine since it's noise, not a one-shot sound; audioEl's
  // duration isn't reliably known yet at this point (metadata may not have
  // loaded), so a fixed loop length avoids depending on it.
  const staticSource = ctx.createBufferSource();
  staticSource.buffer = createStaticBuffer(ctx, 3);
  staticSource.loop = true;
  const staticFilter = ctx.createBiquadFilter();
  staticFilter.type = "bandpass";
  staticFilter.frequency.value = 1500;
  staticFilter.Q.value = 0.6;
  const staticGain = ctx.createGain();
  // Was 0.012 -- present in the waveform, inaudible in practice. Still well
  // under the voice; the point is a bed you notice when it cuts out, not
  // noise you fight to hear through.
  staticGain.gain.value = 0.03;
  staticSource.connect(staticFilter).connect(staticGain).connect(ctx.destination);

  let stopped = false;
  const finished = new Promise<void>((resolve) => {
    audioEl.addEventListener("ended", () => {
      if (stopped) return;
      scheduleSquelchClick(ctx, ctx.destination, ctx.currentTime);
      staticSource.stop();
      void ctx.close();
      resolve();
    });
  });

  void ctx.resume().then(() => {
    scheduleSquelchClick(ctx, ctx.destination, ctx.currentTime + 0.02);
    staticSource.start();
    void audioEl.play();
  });

  return {
    finished,
    handle: {
      stop() {
        if (stopped) return;
        stopped = true;
        audioEl.pause();
        try {
          staticSource.stop();
        } catch {
          /* already stopped */
        }
        void ctx.close();
      },
    },
  };
}
