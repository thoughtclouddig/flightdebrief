/**
 * Whether a user may switch between their own memberships.
 *
 * This was development-only, which quietly broke every multi-membership case
 * the product actually supports: a CFI teaching at two schools, an admin over
 * several locations, a student who joined somewhere new, and a freelance CFI
 * -- who holds admin AND instructor in one org, so with the switcher off they
 * can reach their teaching screens or their billing, never both.
 *
 * getViewer falls back to the first active membership, so without this a user
 * is pinned to whichever was created first with no way out.
 *
 * Safe to expose: POST /api/auth/switch-membership re-reads the caller's own
 * memberships server-side and refuses anything that isn't theirs and active,
 * then stores the choice in an httpOnly, secure cookie. Nothing from the
 * client is trusted except an id that is checked against their own list.
 */
export function isMembershipSwitcherEnabled(): boolean {
  return true;
}
