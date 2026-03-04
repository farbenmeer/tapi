import type { IncomingMessage } from "node:http";
import type { ServerConfig } from "../config";

export function parseURL(
  serverConfig: ServerConfig | undefined,
  req: IncomingMessage,
) {
  try {
    let host = serverConfig?.host ?? "127.0.0.1:3000";
    let proto = serverConfig?.protocol ?? "http";
    if (serverConfig?.trustHostHeader && req.headers.host) {
      host = req.headers.host!;
    }
    if (serverConfig?.trustForwardedHeader) {
      host = (req.headers["x-forwarded-for"] ?? host) as string;
      proto = (req.headers["x-forwarded-proto"] ?? proto) as string;
    }
    const url = new URL(req.url ?? "", `${proto}://${host}`);
    return url;
  } catch (error) {
    console.warn("Bunny: failed to parse URL", error);
    return new URL(req.url ?? "", `127.0.0.1:3000`);
  }
}
