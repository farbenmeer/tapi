import { secureCookie } from "./cookie";
import type { Adapter } from "./define-auth";
import type { MockProviderConfig } from "./provider";

export function handleAuthorizationUrlRequest(
  provider: MockProviderConfig,
  url: URL
) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Mock Auth is only allows in development mode", {
      status: 403,
    });
  }
  return Response.json({
    authorizationUrl: `/api/auth/${
      provider.id
    }/callback?redirect=${encodeURIComponent(
      url.searchParams.get("redirect") ?? "/"
    )}`,
  });
}

export async function handleCallbackRequest(
  adapter: Adapter<unknown>,
  provider: MockProviderConfig,
  url: URL
) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Mock Auth is only allows in development mode", {
      status: 403,
    });
  }
  let userId = await adapter.getUserIdByProviderId(provider.id, "mock");
  if (!userId) {
    const account = await adapter.createAccount(provider.id, {
      sub: "mock",
      email: "mock@example.com",
      name: "Mock User",
    });
    userId = account.userId;
  }
  const sessionId = await adapter.createSession(userId);
  const redirectUrl = new URL(url.searchParams.get("redirect") ?? "/", url);
  const res = Response.redirect(redirectUrl);

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
