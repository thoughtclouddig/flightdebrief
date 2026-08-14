import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { OnboardingForm } from "@/components/onboarding-form";

/**
 * One-time profile completion after the first magic-link login. Returning
 * users who already completed it skip straight to /app.
 */
export default async function OnboardingPage() {
  let viewer;
  try {
    viewer = await getViewer();
  } catch {
    redirect("/login");
  }
  if (viewer.user.profileCompleted) {
    redirect("/app");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">Welcome!</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          You&apos;ve joined {viewer.organization.name}. Confirm your name to continue.
        </p>
      </div>
      <OnboardingForm initialName={viewer.user.name} />
    </div>
  );
}
