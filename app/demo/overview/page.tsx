import { notFound, redirect } from "next/navigation";

/**
 * Video Demo Mode's entry point. Same REPLIT_DEPLOYMENT gate as
 * app/dev/login/page.tsx -- 404s inside a real deployment, never
 * discoverable there. Visiting this URL is Scene 1's starting point: it
 * hands off to /api/demo/enter (which seeds the dataset if needed, mints a
 * session for the student persona, and sets the demo-mode marker cookie)
 * and lands on /home.
 */
export default function DemoOverviewPage() {
  if (process.env.REPLIT_DEPLOYMENT) notFound();
  redirect("/api/demo/enter?as=student&next=/home");
}
