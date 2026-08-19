/**
 * Organization/role switching is a development-only test aid for now.
 * Keeping the policy here lets the page layer, viewer, and API agree so it
 * cannot be revealed or invoked in a published deployment.
 */
export function isMembershipSwitcherEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}