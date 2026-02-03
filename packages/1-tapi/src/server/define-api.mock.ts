import { z } from "zod/v4";
import { defineApi } from "./define-api.js";
import { defineHandler } from "./define-handler.js";
import { TResponse } from "./t-response.js";
import { HttpError } from "../shared/http-error.js";

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
  .route("/books/:id", {
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
  .route("/movies/:id", {
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
            cache: {
              tags: ["movies"],
            },
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
      async (req) =>
        TResponse.json(await req.data(), { cache: { tags: ["movies"] } })
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
  })
  .route("/files/*path", {
    GET: defineHandler(
      {
        params: { path: z.string() },
        authorize: () => true,
      },
      async (req) =>
        TResponse.json({
          path: req.params().path,
          message: `Accessing file: ${req.params().path}`,
        })
    ),
  })
  .route("/wildcard/*", {
    GET: defineHandler(
      {
        authorize: () => true,
      },
      async (req) => TResponse.json({ pathname: req.url })
    ),
  })
  .route("/method", {
    GET: defineHandler(
      {
        authorize: () => true,
      },
      async () => TResponse.json({ method: "GET" })
    ),
    POST: defineHandler(
      {
        authorize: () => true,
      },
      async () => TResponse.json({ method: "POST" })
    ),
    PUT: defineHandler(
      {
        authorize: () => true,
      },
      async () => TResponse.json({ method: "PUT" })
    ),
    PATCH: defineHandler(
      {
        authorize: () => true,
      },
      async () => TResponse.json({ method: "PATCH" })
    ),
    DELETE: defineHandler(
      {
        authorize: () => true,
      },
      async () => TResponse.json({ method: "DELETE" })
    ),
  })
  .route("/error/not-found", {
    GET: defineHandler(
      {
        authorize: () => true,
      },
      async () => {
        throw new HttpError(404, "Not Found");
      }
    ),
  });
