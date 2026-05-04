import { defineApi, defineHandler, TResponse } from "@farbenmeer/tapi/server";
import { z } from "zod";

export const api = defineApi()
  .route("/greet", {
    GET: defineHandler(
      {
        authorize: () => true,
        query: { name: z.string().optional() },
      },
      async (req) => {
        const { name = "world" } = req.query();
        return TResponse.json({ greeting: `hello, ${name}` });
      },
    ),
  })
  .route("/whoami", {
    GET: defineHandler({ authorize: () => true }, async () => {
      return TResponse.json({
        foo: process.env.FOO ?? null,
        bar: process.env.BAR ?? null,
      });
    }),
  });
