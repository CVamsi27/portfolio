import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export const authUser = (
  email = "cvamsik99@gmail.com",
  provider = "google",
) => ({
  id: "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f",
  aud: "authenticated",
  role: "authenticated",
  email,
  email_confirmed_at: "2026-10-11T00:00:00Z",
  created_at: "2026-10-11T00:00:00Z",
  app_metadata: { provider, providers: [provider] },
  user_metadata: {},
  identities: [
    {
      id: "identity",
      user_id: "ac5a22c5-a9c0-4c67-a72e-bebbe9d4ef9f",
      provider,
      identity_data: { email, email_verified: true },
      created_at: "2026-10-11T00:00:00Z",
    },
  ],
});

export const authToken = (kind: string) =>
  `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: kind, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated" })).toString("base64url")}.fixture`;

export function authSession(kind = "allowed", expired = false) {
  return {
    access_token: authToken(kind),
    refresh_token: "refresh-allowed",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600),
    // Deliberately always allowed: forged cookie user data must never authorize.
    user: authUser(),
  };
}

export const sessionCookie = (kind = "allowed", expired = false) =>
  `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(authSession(kind, expired))).toString("base64url")}`;

export async function startAuthFixture() {
  const requests: string[] = [];
  const controls = {
    deviceOwner: "allowed" as "allowed" | "denied" | "unpaired" | "missing",
  };
  const server = createServer(async (request, response) => {
    requests.push(request.url ?? "");
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/auth/v1/user") {
      const token = request.headers.authorization?.slice(7);
      let kind = "invalid";
      try {
        kind = JSON.parse(
          Buffer.from(token?.split(".")[1] ?? "", "base64url").toString(),
        ).sub;
      } catch {}
      if (kind === "outage") {
        response.writeHead(503);
        response.end('{"message":"Unavailable"}');
        return;
      }
      if (kind === "invalid") {
        response.writeHead(401);
        response.end('{"message":"Invalid JWT","code":"bad_jwt"}');
        return;
      }
      response.end(
        JSON.stringify(
          authUser(
            kind === "denied"
              ? "other@gmail.com"
              : kind === "srija"
                ? "srija210v@gmail.com"
                : "cvamsik99@gmail.com",
            kind === "password" ? "email" : "google",
          ),
        ),
      );
      return;
    }
    if (request.url?.startsWith("/auth/v1/token")) {
      let body = "";
      for await (const chunk of request) body += chunk;
      const data = JSON.parse(body);
      if (
        data.auth_code === "allowed-flow" &&
        data.code_verifier !== "flow-verifier"
      ) {
        response.writeHead(400);
        response.end(
          '{"error":"invalid_grant","message":"Wrong flow verifier"}',
        );
        return;
      }
      if (data.auth_code === "invalid") {
        response.writeHead(400);
        response.end('{"error":"invalid_grant","message":"Invalid code"}');
        return;
      }
      response.end(
        JSON.stringify(
          authSession(data.auth_code === "denied" ? "denied" : "allowed"),
        ),
      );
      return;
    }
    if (request.url?.startsWith("/auth/v1/logout")) {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.url?.startsWith("/auth/v1/admin/users/")) {
      response.end(
        JSON.stringify(
          authUser(
            controls.deviceOwner === "denied"
              ? "other@gmail.com"
              : "cvamsik99@gmail.com",
          ),
        ),
      );
      return;
    }
    if (request.url?.startsWith("/rest/v1/health_connect_devices?")) {
      response.end(
        JSON.stringify(
          controls.deviceOwner === "missing"
            ? null
            : {
                user_id:
                  controls.deviceOwner === "unpaired" ? null : authUser().id,
              },
        ),
      );
      return;
    }
    if (request.url?.startsWith("/rest/v1/rpc/health_connect_")) {
      response.end(
        JSON.stringify({
          paired: controls.deviceOwner !== "unpaired",
          accepted: 1,
        }),
      );
      return;
    }
    response.writeHead(404);
    response.end("{}");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url,
    requests,
    controls,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
