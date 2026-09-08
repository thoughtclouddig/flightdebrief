import { NextResponse } from "next/server";
import { isStaging } from "@/lib/env";
import { getFlightDataProvider } from "@/lib/flight-data";

/**
 * Staging-only runtime diagnostic. Answers "what did this exact deployed
 * process actually resolve" -- not what the Secrets UI shows, not what a
 * fresh `next dev` would resolve, but the live singleton this process is
 * already serving requests from. That distinction is the whole point: the
 * FR24 zero-result investigation found FR24_API_KEY present in both the
 * Staging shell and the Secrets UI while a live search request still came
 * back `provider: "unavailable"`, which only a read of the running
 * process's own state -- not its configuration -- can explain (see
 * getFlightDataProvider()'s doc comment; it resolves once and caches for the
 * life of the process, so a config change without a real process restart
 * would stay invisible everywhere except here).
 *
 * Reuses getFlightDataProvider() -- the exact function /api/flights/search
 * calls -- rather than resolving a second, parallel notion of "is FR24
 * configured." A diagnostic that could disagree with the real code path
 * would be worse than no diagnostic at all.
 *
 * 404s outside Staging, matching this codebase's existing pattern for
 * environment-scoped API routes (see app/api/prototype/vector/route.ts).
 * Booleans and a closed set of string literals only in the response --
 * never a value, length, prefix, or anything else that could identify or
 * help brute-force a credential.
 *
 * `fr24AliasTestKey` is a one-off probe, not a permanent field: with
 * FR24_API_KEY confirmed present and value-matched against Production in
 * both the Staging shell and the deployment's own Secrets store, yet still
 * reading false here, the remaining open question is whether the deployment
 * secret *name* "FR24_API_KEY" specifically is the thing failing to inject
 * -- as opposed to every secret, or something about this value. Reading
 * `AFTERFLIGHT_FR24_TEST_KEY`, a name nothing else in this codebase uses,
 * isolates that question: if a secret set under this different name reaches
 * the process while FR24_API_KEY still doesn't, the name itself is
 * implicated, not the deployment's secret-injection mechanism generally.
 */
export async function GET() {
  if (!isStaging()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const provider = getFlightDataProvider();

  return NextResponse.json({
    appEnv: "staging",
    deployment: Boolean(process.env.REPLIT_DEPLOYMENT),
    environment: {
      databaseUrl: Boolean(process.env.DATABASE_URL),
      sessionSecret: Boolean(process.env.SESSION_SECRET),
      fr24ApiKey: Boolean(process.env.FR24_API_KEY),
      deepgramApiKey: Boolean(process.env.DEEPGRAM_API_KEY),
      anthropicApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
      resendApiKey: Boolean(process.env.RESEND_API_KEY),
      fr24AliasTestKey: Boolean(process.env.AFTERFLIGHT_FR24_TEST_KEY),
    },
    flightDataProvider: provider?.name === "fr24" ? "fr24" : "unavailable",
  });
}
