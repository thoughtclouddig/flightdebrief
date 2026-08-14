import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Stateless session for Replit Auth: after the OIDC callback verifies the
 * user, we mint a short JWT (HS256, SESSION_SECRET) into an httpOnly cookie.
 * proxy.ts verifies the same cookie at the edge for route protection.
 */
export const SESSION_COOKIE = "fb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

/** Server-only: read the current session from the request cookies. */
export async function getSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionJwt(token);
}
