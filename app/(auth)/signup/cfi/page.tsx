import { SignupForm } from "@/components/auth/signup-form";

export default function CfiSignupPage() {
  return (
    <SignupForm
      orgKind="independent_cfi"
      subtitle="Start your own AfterFlight, as an independent CFI"
      orgNameLabel="Organization name (optional)"
    />
  );
}
