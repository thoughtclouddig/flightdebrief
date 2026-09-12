/**
 * Deliberately its own tiny, directive-free module. components/support-link.tsx
 * (a "use client" file) used to be the only place this lived, and
 * components/student/profile/support-screen.tsx (a Server Component)
 * imported it from there directly -- Next's RSC bundler treats every export
 * of a "use client" module as an opaque client reference, even a plain
 * string, so a Server Component trying to actually read the value (not just
 * pass it through to a client component) got a synthetic
 * "Attempted to call SUPPORT_EMAIL() from the server" error at the mailto:
 * href instead of the real address. A plain constant with no directive can
 * be imported safely from server or client code, so this is the one place
 * both sides read it from now.
 */
export const SUPPORT_EMAIL = "support@getafterflight.com";
