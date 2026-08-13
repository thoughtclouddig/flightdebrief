// Minimal mock OIDC provider for e2e-testing the Replit Auth flow.
// The app points at it with ISSUER_URL=http://127.0.0.1:<port>; tests choose
// which "Replit user" logs in next by POSTing claims to /__set-claims (the
// OIDC test-claims bypass). Loopback-only, never used in production.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { SignJWT, generateKeyPair, exportJWK } from "jose";

export async function startMockOidc(port) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "e2e-key", alg: "RS256", use: "sig" };
  const issuer = `http://127.0.0.1:${port}`;

  let nextClaims = null; // set via /__set-claims before each login
  const codes = new Map(); // code -> { claims, clientId }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, issuer);
    const json = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === "/.well-known/openid-configuration") {
      return json(200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
        end_session_endpoint: `${issuer}/end-session`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        token_endpoint_auth_methods_supported: ["none"],
        code_challenge_methods_supported: ["S256"],
      });
    }

    if (url.pathname === "/jwks") return json(200, { keys: [jwk] });

    if (url.pathname === "/__set-claims" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      nextClaims = JSON.parse(body);
      return json(200, { ok: true });
    }

    if (url.pathname === "/authorize") {
      if (!nextClaims) return json(400, { error: "no claims staged -- POST /__set-claims first" });
      const code = randomUUID();
      codes.set(code, { claims: nextClaims, clientId: url.searchParams.get("client_id") });
      nextClaims = null;
      const redirect = new URL(url.searchParams.get("redirect_uri"));
      redirect.searchParams.set("code", code);
      redirect.searchParams.set("state", url.searchParams.get("state") ?? "");
      res.writeHead(302, { location: redirect.toString() });
      return res.end();
    }

    if (url.pathname === "/token" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const params = new URLSearchParams(body);
      const entry = codes.get(params.get("code"));
      if (!entry) return json(400, { error: "invalid_grant" });
      codes.delete(params.get("code"));
      const now = Math.floor(Date.now() / 1000);
      const idToken = await new SignJWT({ ...entry.claims })
        .setProtectedHeader({ alg: "RS256", kid: "e2e-key" })
        .setIssuer(issuer)
        .setAudience(entry.clientId)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(privateKey);
      return json(200, {
        access_token: randomUUID(),
        token_type: "Bearer",
        expires_in: 300,
        id_token: idToken,
      });
    }

    if (url.pathname === "/end-session") {
      const to = url.searchParams.get("post_logout_redirect_uri") ?? issuer;
      res.writeHead(302, { location: to });
      return res.end();
    }

    json(404, { error: "not found" });
  });

  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return {
    issuer,
    close: () =>
      new Promise((r) => {
        server.closeAllConnections?.();
        server.close(r);
      }),
  };
}
