import { z } from "zod/v4";
import { defineApi } from "./define-api";
import { defineHandler } from "./define-handler";
import { TResponse } from "./t-response";

export const api = defineApi()
  .route("/books", {
    GET: defineHandler({ authorize: () => true }, async () =>
      TResponse.json([
        { id: "1", title: "Book 1" },
        { id: "2", title: "Book 2" },
      ])
    ),
    POST: defineHandler(
      {
        authorize: () => true,
        body: z.object({
          id: z.string(),
          title: z.string(),
        }),
      },
      async (req) => TResponse.json(await req.data())
    ),
  })
  .route("/books/[id]", {
    GET: defineHandler(
      {
        params: { id: z.string() },
        query: { test: z.string() },
        authorize: () => true,
      },
      async (req) =>
        TResponse.json({
          id: req.params().id,
          title: `Book ${req.params().id}`,
        })
    ),
  })
  .route("/movies/[id]", {
    GET: defineHandler(
      {
        params: { id: z.string() },
        query: { test: z.string() },
        authorize: () => true,
      },
      async (req) =>
        TResponse.json(
          {
            id: req.params().id,
            title: `Movie ${req.params().id}`,
          },
          {
            tags: ["movies"],
          }
        )
    ),
  })
  .route("/movies", {
    POST: defineHandler(
      {
        body: z.object({ id: z.string(), title: z.string() }),
        authorize: () => true,
      },
      async (req) => TResponse.json(await req.data(), { tags: ["movies"] })
    ),
  })
  .route("/authorized", {
    GET: defineHandler(
      {
        authorize: (req) => {
          const header = req.headers.get("Authorization");
          return header === "Bearer token";
        },
      },
      async () => TResponse.json({ authorized: true })
    ),
  });
