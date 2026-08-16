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
      { user: seed.USER_JORDAN, role: "Admin — also a member of Mesa & Prescott below" },
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

export default function DevLoginPage() {
  if (process.env.REPLIT_DEPLOYMENT) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-[#101727]">Dev login</h1>
      <p className="mt-2 text-sm text-[#56636f]">
        Never available in a real deployment (same guard as demo seeding). Click a name to sign in as that seed
        persona instantly — no magic-link email required.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {GROUPS.map((group) => (
          <div key={group.org}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8c97a2]">{group.org}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {group.people.map(({ user, role }) => (
                <li key={user.id}>
                  <Link
                    href={`/api/auth/dev-login?email=${encodeURIComponent(user.email)}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 hover:border-brand hover:bg-brand/5"
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
  );
}
