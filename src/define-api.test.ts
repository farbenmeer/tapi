import { z } from "zod/v4";
import { defineApi } from "./define-api";
import { defineHandler } from "./define-handler";

export const api = defineApi()
  .route("/books", {
    get: defineHandler({}, async () => new Response()),
  })
  .route("/books/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async () => new Response(),
    ),
  })
  .route("/movies/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async () => new Response(),
    ),
  });
