import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import stream from "node:stream";

export function toRequest(req: IncomingMessage, url: URL): Request {
  const headers = new Headers();
  for (const key in req.headers) {
    const value = req.headers[key];
    if (value != null) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.append(key, value);
      }
    }
  }
  let body: ReadableStream | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Convert Node.js Readable stream to Web API ReadableStream
    body = Readable.toWeb(req) as ReadableStream;
  }
  const request_options = {
    method: req.method,
    headers: headers,
    body: body,
    duplex: "half" as const,
  };
  const request = new Request(url.toString(), request_options);
  return request;
}

export async function fromResponse(node: ServerResponse, web: Response) {
  node.statusCode = web.status;
  node.statusMessage = web.statusText;
  web.headers.forEach((value, key) => node.setHeader(key, value));
  if (node.closed) {
    console.warn("Response was closed before it was fully written");
  }
  await web.body?.pipeTo(stream.Writable.toWeb(node));
}
