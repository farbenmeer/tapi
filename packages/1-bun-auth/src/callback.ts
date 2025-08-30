import * as oauth from "oauth4webapi";
import type { OauthProviderConfig, ProviderConfig } from "./provider";
import type { Adapter, AuthDefinition } from "./define-auth";
import type { BunRequest } from "bun";
import { secureCookie } from "./cookie";

interface Options {
  currentUrl: URL;
  code_verifier: string;
  nonce?: string;
  redirectUri: string;
}

export async function callback(
  { client_id, client_secret, authorizationServer }: OauthProviderConfig,
  { currentUrl, code_verifier, nonce, redirectUri }: Options
) {
  const as = await authorizationServer;
  const client: oauth.Client = { client_id };
  const clientAuth = oauth.ClientSecretPost(client_secret);

  // one eternity later, the user lands back on the redirect_uri
  // Authorization Code Grant Request & Response
  let access_token: string;
  const params = oauth.validateAuthResponse(as, client, currentUrl);

  const response = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    clientAuth,
    params,
    redirectUri,
    code_verifier
  );

  const result = await oauth.processAuthorizationCodeResponse(
    as,
    client,
    response,
    {
      expectedNonce: nonce,
      requireIdToken: true,
    }
  );

  ({ access_token } = result);
  const claims = oauth.getValidatedIdTokenClaims(result)!;

  return { accessToken: access_token, claims };
}

async function getUserInfo(
  provider: OauthProviderConfig,
  accessToken: string,
  sub: string
) {
  const as = await provider.authorizationServer;
  const client = { client_id: provider.client_id };

  const userInfoResponse = await oauth.userInfoRequest(as, client, accessToken);

  const userInfo = await oauth.processUserInfoResponse(
    as,
    client,
    sub,
    userInfoResponse
  );

  return userInfo;
}

export async function handleCallbackRequest(
  adapter: Adapter<unknown>,
  provider: OauthProviderConfig,
  req: BunRequest
) {
  const codeVerifier = req.cookies.get("bun-auth-code-verifier");
  const nonce = req.cookies.get("bun-auth-nonce");
  const redirectUri = new URL(
    `/api/auth/${provider.id}/callback`,
    req.url
  ).toString();

  if (!codeVerifier) {
    return new Response("Code verifier not found", { status: 400 });
  }

  const currentUrl = new URL(req.url);
  let accessToken, claims;
  try {
    ({ accessToken, claims } = await callback(provider, {
      currentUrl: currentUrl,
      code_verifier: codeVerifier,
      nonce: nonce || undefined,
      redirectUri,
    }));
  } catch (error) {
    return new Response("Authentication failed", { status: 401 });
  }

  let userId;
  try {
    userId = await adapter.getUserIdByProviderId(provider.id, claims.sub);
  } catch (error) {
    return new Response("Database Error: User lookup failed", {
      status: 500,
    });
  }

  if (!userId) {
    let userInfo;
    try {
      userInfo = await getUserInfo(provider, accessToken, claims.sub);
    } catch (error) {
      return new Response("Error fetching user info", { status: 500 });
    }
    try {
      const account = await adapter.createAccount(provider.id, userInfo);
      userId = account.userId;
    } catch (error) {
      return new Response("Database Error: Account creation failed", {
        status: 500,
      });
    }
  }

  try {
    const sessionId = await adapter.createSession(userId);

    const redirectUrl =
      req.cookies.get("bun-auth-redirect") ??
      currentUrl.protocol + "//" + currentUrl.host;

    const res = Response.redirect(redirectUrl);
    res.headers.append(
      "Set-Cookie",
      secureCookie("bun-auth-session", sessionId, {
        secure: process.env.NODE_ENV !== "development",
        path: "/",
        maxAge: 31536000,
      })
    );
    return res;
  } catch (error) {
    return new Response("Database Error: Session creation failed", {
      status: 500,
    });
  }
}
