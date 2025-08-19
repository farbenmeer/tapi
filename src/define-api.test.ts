import { z } from "zod/v4";
import { defineApi } from "./define-api";
import { defineHandler } from "./define-handler";
import { TResponse } from "./t-response";

export const api = defineApi()
  .route("/books", {
    get: defineHandler({}, async () =>
      TResponse.json({ message: "Hello World!" }),
    ),
  })
  .route("/books/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async () => TResponse.json({ message: "Hello World!" }),
    ),
  })
  .route("/movies/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async () => new TResponse(),
    ),
  });
