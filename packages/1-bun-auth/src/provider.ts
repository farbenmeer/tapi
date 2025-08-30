import * as oauth from "oauth4webapi";

interface OauthOptions {
  id: string;
  clientId: string;
  clientSecret: string;
  issuer: string;
}

export interface OauthProviderConfig {
  type: "oauth";
  id: string;
  client_id: string;
  client_secret: string;
  authorizationServer: Promise<oauth.AuthorizationServer>;
}

export function OauthProvider(options: OauthOptions): ProviderConfig {
  const issuer = new URL(options.issuer);
  const as = oauth
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

export type ProviderConfig = OauthProviderConfig;
