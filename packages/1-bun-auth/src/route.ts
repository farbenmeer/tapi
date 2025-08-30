import type { BunRequest } from "bun";
import type { AuthDefinition } from "./define-auth";
import { handleAuthorizationUrlRequest } from "./authorization-url";
import { handleCallbackRequest } from "./callback";
import { secureCookie } from "./cookie";

type AuthRouteHandler = (req: BunRequest<"/api/auth/*">) => Promise<Response>;

export function createAuthRoute(
  auth: AuthDefinition<unknown>
): AuthRouteHandler {
  return async function handleAuthRequest(req) {
    console.log("handle auth request", req.url);
    const url = new URL(req.url);

    if (url.pathname === "/api/auth/session") {
      const session = await auth(req);
      return Response.json(session);
    }

    const match = url.pathname.match(
      /^\/api\/auth\/(?<provider>\w+)\/(?<method>\w+)\/?$/
    );

    if (match) {
      const { provider, method } = match.groups!;
      const providerConfig = auth.providers[provider!];
      if (!providerConfig) {
        return new Response("Provider not found", { status: 404 });
      }

      switch (providerConfig.type) {
        case "mock":
          switch (method) {
            case "url":
              if (process.env.NODE_ENV !== "development") {
                return new Response(
                  "Mock Auth is only allows in development mode",
                  { status: 403 }
                );
              }
              return Response.json({
                authorizationUrl: `/api/auth/${
                  providerConfig.id
                }/callback?redirect=${encodeURIComponent(url.pathname)}`,
              });

            case "callback": {
              if (process.env.NODE_ENV !== "development") {
                return new Response(
                  "Mock Auth is only allows in development mode",
                  { status: 403 }
                );
              }
              let userId = await auth.adapter.getUserIdByProviderId(
                providerConfig.id,
                "mock"
              );
              if (!userId) {
                const account = await auth.adapter.createAccount(
                  providerConfig.id,
                  {
                    sub: "mock",
                    email: "mock@example.com",
                    name: "Mock User",
                  }
                );
                userId = account.userId;
              }
              const sessionId = await auth.adapter.createSession(userId);
              const res = Response.redirect(
                url.protocol +
                  "//" +
                  url.host +
                  (url.searchParams.get("redirect") ?? "/")
              );

              res.headers.append(
                "Set-Cookie",
                secureCookie("bun-auth-session", sessionId, {
                  secure: false,
                  path: "/",
                  maxAge: 31536000,
                })
              );
              return res;
            }

            default:
              return new Response(
                `Resource ${method} for provider ${provider} not found`,
                { status: 404 }
              );
          }

        case "oauth":
          switch (method) {
            case "url":
              return handleAuthorizationUrlRequest(
                providerConfig,
                url.toString()
              );

            case "callback":
              return handleCallbackRequest(auth.adapter, providerConfig, req);

            default:
              return new Response(
                `Resource ${method} for provider ${provider} not found`,
                { status: 404 }
              );
          }
      }
    }

    return new Response("Not found", { status: 404 });
  };
}
