import { SignupForm } from "@/components/auth/signup-form";

export default function CfiSignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <SignupForm
        orgKind="independent_cfi"
        subtitle="Start your own AfterFlight, as an independent CFI"
        orgNameLabel="Organization name (optional)"
      />
      <p className="text-center text-xs font-semibold text-brand">
        AfterFlight is free for CFIs &mdash; no trial, no expiration.
      </p>
    </div>
  );
}
