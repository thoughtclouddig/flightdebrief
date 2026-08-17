import { Mail } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";

export default function StudentSignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <SignupForm orgKind="individual" subtitle="Start training with AfterFlight, on your own" />
      <p className="text-center text-xs font-semibold text-brand">Your first 3 flights are free.</p>

      <div className="flex items-start gap-3 rounded-lg border border-hairline p-4">
        <Mail className="mt-0.5 size-5 shrink-0 text-brand" />
        <p className="text-sm text-foreground-soft">
          Already training with a CFI or flight school? Ask them to invite you instead &mdash; that way your
          debriefs are tied to their roster from the start.
        </p>
      </div>
    </div>
  );
}
