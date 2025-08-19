import { z } from "zod/v4";
import { defineApi } from "./define-api";
import { defineHandler } from "./define-handler";
import { TResponse } from "./t-response";

export const api = defineApi()
  .route("/books", {
    get: defineHandler({}, async () =>
      TResponse.json([
        { id: "1", title: "Book 1" },
        { id: "2", title: "Book 2" },
      ]),
    ),
  })
  .route("/books/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async (req) =>
        TResponse.json({
          id: req.params.id,
          title: `Book ${req.params.id}`,
        }),
    ),
  })
  .route("/movies/[id]", {
    get: defineHandler(
      { params: ["id"], query: { test: z.string() } },
      async (req) =>
        TResponse.json({
          id: req.params.id,
          title: `Movie ${req.params.id}`,
        }),
    ),
  });
