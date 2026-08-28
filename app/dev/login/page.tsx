import { notFound } from "next/navigation";
import Link from "next/link";
import * as seed from "@/lib/data/seed";

const GROUPS = [
  {
    org: "Falcon Aviation — School Pro",
    people: [
      { user: seed.USER_ANDY, role: "Student" },
      { user: seed.USER_DANNY, role: "CFI" },
      { user: seed.USER_MARIA, role: "CFI" },
      { user: seed.USER_SARAH, role: "Student" },
      { user: seed.USER_MARCUS, role: "Student" },
      { user: seed.USER_PRIYA, role: "Student" },
      { user: seed.USER_TOM, role: "Student" },
      { user: seed.USER_JORDAN, role: "Admin" },
    ],
  },
  {
    org: "Kevin Ortiz's Flight Training — Independent CFI",
    people: [
      { user: seed.USER_KEVIN, role: "Independent CFI" },
      { user: seed.USER_EMMA, role: "Student" },
    ],
  },
  {
    org: "Alex Rivera's Flights — Individual",
    people: [{ user: seed.USER_ALEX, role: "Solo student, no CFI on the account" }],
  },
  {
    org: "Mesa Flight Academy — School Pro (location 2)",
    people: [
      { user: seed.USER_NINA, role: "CFI" },
      { user: seed.USER_CARLOS, role: "Student" },
      { user: seed.USER_LEAH, role: "Student" },
    ],
  },
  {
    org: "Prescott Aviation — School Pro (location 3)",
    people: [
      { user: seed.USER_OMAR, role: "CFI" },
      { user: seed.USER_ZOE, role: "Student" },
    ],
  },
];

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

export default function DevLoginPage() {
  if (process.env.REPLIT_DEPLOYMENT) notFound();
  const staff = staffEmails();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-[#101727]">Dev login</h1>
        <p className="mt-2 text-sm text-[#56636f]">
          Never available in a real deployment (same guard as demo seeding). Click a name to sign in as that seed
          persona instantly — no magic-link email required.
        </p>

        <div className="mt-10 flex flex-col gap-10">
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
                      <span className="text-sm text-[#56636f]">Super Admin</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {GROUPS.map((group) => (
            <div key={group.org}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8c97a2]">{group.org}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {group.people.map(({ user, role }) => (
                  <li key={user.id}>
                    <Link
                      href={`/api/auth/dev-login?email=${encodeURIComponent(user.email)}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-brand hover:bg-brand/5"
                    >
                      <span className="font-medium text-[#101727]">{user.name}</span>
                      <span className="text-sm text-[#56636f]">{role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
