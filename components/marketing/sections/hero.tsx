import Link from "next/link";
import { AnimatedTrack } from "@/components/marketing/animated-track";
import { DEMO_FLIGHT } from "@/lib/marketing/demo-data";

/**
 * No hero photo/video for now. The Higgsfield generation (see git history --
 * cinematic_studio_video_v2, 16:9, ~10s, genre "intimate", mode "pro",
 * sound "off") and the nano_banana_pro poster both failed: the workspace
 * ran out of credits. The poster that *did* generate had headsets on both
 * people, which wouldn't happen standing on the ramp post-flight, and read
 * as visibly AI-generated -- pulled rather than shipped with a fix pending.
 *
 * This uses the site's own flight-track motif (see components/marketing/
 * animated-track.tsx, reused from the "How It Works" and "Flight Data"
 * sections) as the hero visual instead -- no photo needed, and it reinforces
 * the same "your flight becomes the plan" idea rather than illustrating it
 * once and never again.
 *
 * To bring photography back once credits are available, regenerate with:
 * "Candid documentary photograph, not a posed studio shot, at a general
 * aviation airport in the American Southwest immediately after a flight
 * training lesson. A modern single-engine Diamond DA40-style training
 * aircraft parked on the ramp, engine off, no headsets anywhere in the frame
 * -- neither person is wearing a headset or holding one, nothing hanging
 * around their necks. A student pilot and a flight instructor, both
 * bare-headed except maybe a plain ballcap, stand beside the aircraft
 * mid-conversation in normal casual clothes, weight shifted naturally,
 * mid-gesture, imperfect candid body language like a real snapshot, not a
 * symmetrical hero pose. Golden-hour sunlight, long shadows, realistic GA
 * hangars and small aircraft softly visible in the background, subtle heat
 * haze, slight film grain, natural skin texture with visible imperfections,
 * shot on a real camera with a 50mm lens look, slightly off-center
 * composition. Avoid: airbrushed or glossy CGI look, plastic skin,
 * symmetrical composition, stock-photo posing, looking at camera, headsets,
 * luxury jet, airline, military aviation, text, logos, futuristic interface,
 * exaggerated lens flare."
 */
export function Hero() {
  return (
    <section className="relative flex h-[100svh] min-h-[560px] items-end overflow-hidden bg-[#101727]">
      <div className="absolute inset-0 z-0 opacity-[0.14]">
        <AnimatedTrack track={DEMO_FLIGHT.track ?? []} cover className="h-full w-full" />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/60 to-[#0c1220]/20" />

      <div className="relative z-30 mx-auto w-full max-w-6xl px-6 pb-20 pt-32 sm:pb-28">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Flight training, remembered</p>
        <h1 className="font-display mt-4 max-w-2xl text-balance text-[clamp(2.75rem,9vw,4.75rem)] font-extrabold uppercase leading-[0.98] text-white">
          Get better every flight.
        </h1>
        <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/85">
          Record the debrief you&rsquo;re already having. AfterFlight turns it into the plan for your next flight.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="#how-it-works" className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
            See How It Works
          </Link>
          <Link
            href="#schools"
            className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            For Flight Schools
          </Link>
        </div>

        <p className="mt-5 text-xs text-white/55">No forms. No extra notes. Just have your normal debrief.</p>
      </div>
    </section>
  );
}
