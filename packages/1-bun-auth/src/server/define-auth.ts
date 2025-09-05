import { CookieMap, type BunRequest } from "bun";
import type { ProviderConfig } from "./provider";
import type { UserInfoResponse } from "oauth4webapi";

export interface AuthDefinition<Session> {
  (req: BunRequest | Request): Promise<Session | null>;
  providers: Record<string, ProviderConfig>;
  adapter: Adapter<Session>;
}

export interface Adapter<Session> {
  getUserIdByProviderId: (
    provider: string,
    providerAccountId: string
  ) => Promise<string | null>;
  createAccount: (
    provider: string,
    userInfo: UserInfoResponse
  ) => Promise<{ userId: string }>;
  createSession: (userId: string) => Promise<string>;
  getSession: (sessionId: string) => Promise<Session | null>;
}

interface Options<Session> {
  providers: ProviderConfig[];
  adapter: Adapter<Session>;
}

export function defineAuth<Session>(
  options: Options<Session>
): AuthDefinition<Session> {
  function auth(req: BunRequest | Request) {
    const cookies =
      "cookies" in req
        ? req.cookies
        : new CookieMap(req.headers.get("Cookie") ?? {});

    const sessionId = cookies.get("bun-auth-session");
    if (!sessionId) return Promise.resolve(null);

    return options.adapter.getSession(sessionId);
  }

  return Object.assign(auth, {
    providers: Object.fromEntries(
      options.providers.map((provider) => [provider.id, provider])
    ),
    adapter: options.adapter,
  });
}
