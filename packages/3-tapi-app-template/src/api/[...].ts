import { defineEventHandler } from "h3";
import { createRequestHandler } from "@farbenmeer/tapi/server";
import { api } from "../api";

const handle = createRequestHandler(api, {
  basePath: "/api",
  hooks: { error: (e) => console.error(e) },
});

export default defineEventHandler((event) => handle(event.req));
