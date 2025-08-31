import * as oauth from "oauth4webapi";
import { secureCookie } from "../cookie";
import type { OauthProviderConfig } from "../provider";

export async function generateAuthorizationUrl(
  { client_id, authorizationServer }: OauthProviderConfig,
  { redirectUri }: { redirectUri: string }
) {
  const as = await authorizationServer;

  const client: oauth.Client = { client_id };

  const code_challenge_method = "S256";
  /**
   * The following MUST be generated for every redirect to the authorization_endpoint. You must store
   * the code_verifier and nonce in the end-user session such that it can be recovered as the user
   * gets redirected from the authorization server back to your application.
   */
  const code_verifier = oauth.generateRandomCodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  let nonce: string | undefined;

  // redirect user to as.authorization_endpoint
  const authorizationUrl = new URL(as.authorization_endpoint!);
  authorizationUrl.searchParams.set("client_id", client.client_id);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email");
  authorizationUrl.searchParams.set("code_challenge", code_challenge);
  authorizationUrl.searchParams.set(
    "code_challenge_method",
    code_challenge_method
  );

  /**
   * We cannot be sure the AS supports PKCE so we're going to use nonce too. Use of PKCE is
   * backwards compatible even if the AS doesn't support it which is why we're using it regardless.
   */
  if (as.code_challenge_methods_supported?.includes("S256") !== true) {
    nonce = oauth.generateRandomNonce();
    authorizationUrl.searchParams.set("nonce", nonce);
  }

  return {
    authorizationUrl,
    codeVerifier: code_verifier,
    nonce,
  };
}

export async function handleAuthorizationUrlRequest(
  provider: OauthProviderConfig,
  url: URL
) {
  const redirectUri = new URL(`/api/auth/${provider.id}/callback`, url);

  redirectUri.searchParams.set(
    "redirect",
    url.searchParams.get("redirect") ?? "/"
  );

  const { authorizationUrl, codeVerifier, nonce } =
    await generateAuthorizationUrl(provider, {
      redirectUri: redirectUri.toString(),
    });

  const isDev = process.env.NODE_ENV === "development";

  return Response.json(
    {
      authorizationUrl: authorizationUrl.toString(),
    },
    {
      headers: [
        [
          "Set-Cookie",
          secureCookie("bun-auth-code-verifier", codeVerifier, {
            secure: !isDev,
          }),
        ],
        [
          "Set-Cookie",
          secureCookie("bun-auth-nonce", nonce, {
            secure: !isDev,
          }),
        ],
      ],
    }
  );
}
