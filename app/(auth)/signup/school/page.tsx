import { SignupForm } from "@/components/auth/signup-form";

export default function SchoolSignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <SignupForm orgKind="school" subtitle="Start your own AfterFlight, as a flight school" orgNameLabel="School name" />
      <p className="text-center text-xs font-semibold text-brand">Your school&rsquo;s first 25 debriefs are free.</p>
    </div>
  );
}
