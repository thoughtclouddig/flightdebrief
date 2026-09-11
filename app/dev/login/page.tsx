import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * Staff aren't seed personas -- they're whoever SUPERADMIN_EMAILS lists, which
 * differs per environment. Read at request time rather than hardcoded so this
 * list is always the same one the staff gate itself checks.
 */
function staffEmails(): string[] {
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * The five real-account scenarios this page exists for -- deliberately not
 * every seed persona in lib/data/seed.ts (most of those aren't real rows in
 * whatever Postgres database this environment is actually connected to, and
 * fail at login with "not-invited"). Each of these is a real Gmail
 * plus-alias the app owner can actually receive mail at, but the link below
 * goes through the same instant /api/auth/dev-login path as the company-
 * staff rows further down -- no magic-link email, straight into the account
 * -- IF this row is a real row in this environment's database. If it isn't
 * (same "not-invited" failure mode as the seed personas this page used to
 * list), the fallback is the real magic-link flow at /login, which only
 * needs the row to exist, not this environment's dev-login guard to be open.
 */
const REAL_ACCOUNT_LOGINS = [
  { role: "Solo student, no CFI", persona: "Alex Rivera", email: "andyrenk+indystudent@gmail.com" },
  { role: "Regular student", persona: "Andy", email: "andyrenk+student@gmail.com" },
  { role: "CFI (school)", persona: "Danny Franks, Falcon Aviation", email: "andyrenk+cfi@gmail.com" },
  { role: "Independent CFI", persona: "Kevin Ortiz", email: "andyrenk+indycfi@gmail.com" },
  { role: "School admin", persona: "Jordan Reyes, Falcon Aviation", email: "andyrenk+admin@gmail.com" },
] as const;

/**
 * Rendered per request, not prerendered.
 *
 * The REPLIT_DEPLOYMENT guard below is only a guard if it runs at request
 * time. Without this the page is static, the check evaluates during the
 * BUILD -- where REPLIT_DEPLOYMENT is never set -- and the login form gets
 * baked into HTML that production then serves to everyone. The build output
 * said so plainly: this route was marked static while the API route beside
 * it, carrying the identical check, was dynamic.
 */
export const dynamic = "force-dynamic";

export default function DevLoginPage() {
  if (process.env.REPLIT_DEPLOYMENT) notFound();
  const staff = staffEmails();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-[#101727]">Dev login</h1>
        <p className="mt-2 text-sm text-[#414B57]">
          Never available in a real deployment. Click a row for an instant session -- no magic-link email. If this
          environment&rsquo;s database has never had this row created, it&rsquo;ll bounce to sign-in with the email
          already filled in instead; the &ldquo;via magic link&rdquo; link does that directly.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8c97a2]">Real accounts — one per core use case</p>
            <ul className="mt-3 flex flex-col gap-2">
              {REAL_ACCOUNT_LOGINS.map(({ role, persona, email }) => (
                <li key={email} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand hover:bg-brand/5">
                  <Link href={`/api/auth/dev-login?email=${encodeURIComponent(email)}`} className="min-w-0 flex-1">
                    <span className="block font-medium text-[#101727]">{role}</span>
                    <span className="block text-xs text-[#8c97a2]">{persona}</span>
                  </Link>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm text-[#414B57]">{email}</span>
                    <Link href={`/login?email=${encodeURIComponent(email)}`} className="text-xs text-brand hover:underline">
                      via magic link
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {staff.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8c97a2]">AfterFlight — company staff</p>
              <ul className="mt-3 flex flex-col gap-2">
                {staff.map((email) => (
                  <li key={email}>
                    {/* Straight to the console. Everyone else here lands in a
                        product shell, but staff have no organization, so
                        "where you left off" isn't a place that exists. */}
                    <Link
                      href={`/api/auth/dev-login?email=${encodeURIComponent(email)}&next=${encodeURIComponent("/super-admin")}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand hover:bg-brand/5"
                    >
                      <span className="font-medium text-[#101727]">{email}</span>
                      <span className="text-sm text-[#414B57]">Super Admin</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
