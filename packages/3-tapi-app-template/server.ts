import { defineEventHandler, HTTPResponse } from "h3";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "./src/api";

const handle = createRequestHandler(api, {
  basePath: "/api",
  hooks: { error: (e) => console.error(e) },
});

export default defineEventHandler(async (event) => {
  if (!event.url.pathname.startsWith("/api/")) return;
  const res = await handle(event.req);
  return new HTTPResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
});
