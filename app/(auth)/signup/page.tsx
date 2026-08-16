import Link from "next/link";
import Image from "next/image";
import { Building2, GraduationCap, Headset, type LucideIcon } from "lucide-react";

const ROLES: { href: string; icon: LucideIcon; title: string; copy: string }[] = [
  {
    href: "/signup/student",
    icon: GraduationCap,
    title: "I'm a student pilot",
    copy: "Fly solo, or join through your CFI or flight school's invite.",
  },
  {
    href: "/signup/cfi",
    icon: Headset,
    title: "I'm an independent CFI",
    copy: "Start your own AfterFlight and invite your students.",
  },
  {
    href: "/signup/school",
    icon: Building2,
    title: "I'm a flight school",
    copy: "Set up your school, then invite your CFIs and students.",
  },
];

export default function SignupRolePickerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/afterflight-lockup-dark.svg"
          alt="AfterFlight"
          width={186}
          height={30}
          className="dark:hidden"
          priority
        />
        <Image
          src="/brand/afterflight-lockup-light.svg"
          alt="AfterFlight"
          width={186}
          height={30}
          className="hidden dark:block"
          priority
        />
        <p className="mt-2 text-sm text-foreground-soft">Which best describes you?</p>
      </div>

      <div className="flex flex-col gap-3">
        {ROLES.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className="flex items-start gap-3 rounded-lg border border-hairline p-4 text-left hover:bg-surface-sunken"
          >
            <role.icon className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-foreground">{role.title}</p>
              <p className="mt-0.5 text-xs text-foreground-soft">{role.copy}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-foreground-faint">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
        .
      </p>
      <Link href="/" className="text-center text-xs text-foreground-faint hover:underline">
        &larr; Back to afterflight.com
      </Link>
    </div>
  );
}
