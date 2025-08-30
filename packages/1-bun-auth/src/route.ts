import type { BunRequest } from "bun";
import type { AuthDefinition } from "./define-auth";
import { handleAuthorizationUrlRequest } from "./authorization-url";
import { handleCallbackRequest } from "./callback";

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
