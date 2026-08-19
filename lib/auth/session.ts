import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Stateless session for Replit Auth: after the OIDC callback verifies the
 * user, we mint a short JWT (HS256, SESSION_SECRET) into an httpOnly cookie.
 * proxy.ts verifies the same cookie at the edge for route protection.
 */
export const SESSION_COOKIE = "fb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Which of the signed-in user's organization_members rows is "active" -- see lib/viewer.ts's getViewer() and app/api/auth/switch-membership/route.ts. */
export const ACTIVE_MEMBERSHIP_COOKIE = "fb_active_membership";

export interface SessionClaims {
  /** Replit user id (OIDC `sub`) -- maps to users.auth_user_id. */
  sub: string;
  email: string | null;
  name: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set.");
  return new TextEncoder().encode(secret);
}

export async function createSessionJwt(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getSecret());
}

export async function verifySessionJwt(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    // Purpose-bound: a magic-link token must never be usable as a session.
    if (!payload.sub || payload.purpose !== "session") return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

/**
 * Magic-link tokens: short-lived JWTs emailed to the user. Signed with the
 * same secret but a distinct `purpose` claim so a magic-link token can never
 * be replayed as a session cookie (and vice versa).
 */
export const MAGIC_LINK_MAX_AGE_SECONDS = 60 * 15; // 15 minutes

export async function createMagicLinkJwt(email: string): Promise<string> {
  return new SignJWT({ purpose: "magic-link" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAGIC_LINK_MAX_AGE_SECONDS)
    .sign(getSecret());
}

/** Returns the normalized email the link was minted for, or null. */
export async function verifyMagicLinkJwt(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "magic-link" || typeof payload.sub !== "string" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Signup-link tokens: same shape as magic-link tokens but carry a name,
 * optional org name, and which kind of org to create, so self-serve signup
 * (lib/auth/store.ts's resolveSignupOnLogin) has what it needs once the link
 * is clicked -- a distinct `purpose` keeps this from ever being replayed as
 * a plain sign-in.
 */
export const SIGNUP_LINK_MAX_AGE_SECONDS = 60 * 15; // 15 minutes

/** Which self-serve signup flow this link was minted for -- see app/(auth)/signup/{cfi,school,student}. */
export type SignupOrgKind = "independent_cfi" | "school" | "individual";

export interface SignupLinkClaims {
  email: string;
  name: string;
  orgName: string | null;
  orgKind: SignupOrgKind;
}

export async function createSignupLinkJwt(input: SignupLinkClaims): Promise<string> {
  return new SignJWT({ purpose: "signup-link", name: input.name, orgName: input.orgName, orgKind: input.orgKind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SIGNUP_LINK_MAX_AGE_SECONDS)
    .sign(getSecret());
}

export async function verifySignupLinkJwt(token: string): Promise<SignupLinkClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "signup-link" || typeof payload.sub !== "string" || !payload.sub) return null;
    return {
      email: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      orgName: typeof payload.orgName === "string" ? payload.orgName : null,
      orgKind: payload.orgKind === "school" || payload.orgKind === "individual" ? payload.orgKind : "independent_cfi",
    };
  } catch {
    return null;
  }
}

/**
 * Email-change confirmation tokens: emailed to the NEW address so changing
 * your sign-in email always re-proves you actually control that inbox --
 * same shape/expiry as a magic link, but carries which user is changing
 * (their auth_user_id is the OLD email, so the confirm route can't infer it
 * from the token's subject the way a plain login can).
 */
export const EMAIL_CHANGE_MAX_AGE_SECONDS = 60 * 15; // 15 minutes

export interface EmailChangeClaims {
  userId: string;
  newEmail: string;
}

export async function createEmailChangeJwt(input: EmailChangeClaims): Promise<string> {
  return new SignJWT({ purpose: "email-change", userId: input.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.newEmail.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + EMAIL_CHANGE_MAX_AGE_SECONDS)
    .sign(getSecret());
}

export async function verifyEmailChangeJwt(token: string): Promise<EmailChangeClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== "email-change" || typeof payload.sub !== "string" || typeof payload.userId !== "string") {
      return null;
    }
    return { userId: payload.userId, newEmail: payload.sub };
  } catch {
    return null;
  }
}

/** Server-only: read the current session from the request cookies. */
export async function getSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionJwt(token);
}

/**
 * Shared-password gate in front of the whole marketing site (proxy.ts),
 * entirely separate from real user auth above -- deliberately keyed off its
 * own SITE_ACCESS_CODE secret (used both as the password visitors type and
 * as the signing key here) rather than SESSION_SECRET, so it can be turned
 * on/off independently and never fails a real login/session check if it's
 * misconfigured. Unset SITE_ACCESS_CODE means the gate is simply off.
 */
export const SITE_GATE_COOKIE = "fb_site_gate";
export const SITE_GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSiteAccessCode(): string | null {
  const code = process.env.SITE_ACCESS_CODE;
  return code && code.trim() ? code.trim() : null;
}

export function isSiteGateEnabled(): boolean {
  return getSiteAccessCode() !== null;
}

export function checkSiteAccessCode(candidate: string): boolean {
  const code = getSiteAccessCode();
  return code !== null && candidate === code;
}

export async function createSiteGateJwt(): Promise<string | null> {
  const code = getSiteAccessCode();
  if (!code) return null;
  return new SignJWT({ purpose: "site-gate" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SITE_GATE_MAX_AGE_SECONDS)
    .sign(new TextEncoder().encode(code));
}

export async function verifySiteGateJwt(token: string): Promise<boolean> {
  const code = getSiteAccessCode();
  if (!code) return true; // gate disabled -- nothing to verify against
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(code));
    return payload.purpose === "site-gate";
  } catch {
    return false;
  }
}
