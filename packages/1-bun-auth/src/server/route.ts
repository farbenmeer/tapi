import type { BunRequest } from "bun";
import type { AuthDefinition } from "./define-auth";
import * as mock from "./mock";
import * as oauth from "./oauth";
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

    if (url.pathname === "/api/auth/sign-out") {
      const redirect = url.searchParams.get("redirect") ?? "/";
      const res = Response.redirect(redirect);
      res.headers.append(
        "Set-Cookie",
        secureCookie("bun-auth-session", "", {
          secure: process.env.NODE_ENV !== "development",
          path: "/",
          maxAge: 0,
        })
      );
      return res;
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
              return mock.handleAuthorizationUrlRequest(providerConfig, url);

            case "callback":
              return mock.handleCallbackRequest(
                auth.adapter,
                providerConfig,
                url
              );

            default:
              return new Response(
                `Resource ${method} for provider ${provider} not found`,
                { status: 404 }
              );
          }

        case "oauth":
          switch (method) {
            case "url":
              return oauth.handleAuthorizationUrlRequest(providerConfig, url);

            case "callback":
              return oauth.handleCallbackRequest(
                auth.adapter,
                providerConfig,
                req
              );

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
