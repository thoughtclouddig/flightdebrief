import type { ReactNode } from "react";

/**
 * AfterFlight's own console lives in its own route group so it doesn't
 * inherit the customer product's layout -- that layout calls getViewer(),
 * which requires an active organization membership, and renders the nav for
 * whichever school you're acting in. Neither applies to staff.
 *
 * Being outside (product) is the whole point: signing in as staff used to
 * mean first creating an organization for yourself and then finding this
 * behind a "More" menu in a student's navigation.
 */
export default function StaffRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
