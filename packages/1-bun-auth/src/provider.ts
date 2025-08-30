import type { MaybePromise } from "bun";
import * as oauth from "oauth4webapi";

interface OauthOptions {
  id: string;
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationServer?: Omit<oauth.AuthorizationServer, "issuer">;
}

export interface OauthProviderConfig {
  type: "oauth";
  id: string;
  client_id: string;
  client_secret: string;
  authorizationServer: MaybePromise<oauth.AuthorizationServer>;
}

export function OauthProvider(options: OauthOptions): ProviderConfig {
  const issuer = new URL(options.issuer);
  const as = options.authorizationServer
    ? { ...options.authorizationServer, issuer: options.issuer }
    : oauth
        .discoveryRequest(new URL(issuer), { algorithm: "oidc" })
        .then((response) => oauth.processDiscoveryResponse(issuer, response));
  return {
    type: "oauth",
    id: options.id,
    client_id: options.clientId,
    client_secret: options.clientSecret,
    authorizationServer: as,
  };
}

interface MockProviderConfig {
  type: "mock";
  id: string;
}

interface MockProviderOptions {
  id?: string;
}

export function MockProvider(
  options?: MockProviderOptions
): MockProviderConfig {
  return {
    type: "mock",
    id: options?.id ?? "mock",
  };
}

export type ProviderConfig = OauthProviderConfig | MockProviderConfig;
