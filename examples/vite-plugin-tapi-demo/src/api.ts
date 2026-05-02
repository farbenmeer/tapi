import { defineApi, defineHandler, TResponse } from "@farbenmeer/tapi/server";
import { z } from "zod";

export const api = defineApi().route("/greet", {
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
});
