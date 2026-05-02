import { defineHandler, TResponse } from "@farbenmeer/tapi/server";
import { z } from "zod";

export const GET = defineHandler(
  {
    authorize: () => true,
    query: {
      who: z.string(),
    },
  },
  async (req) => {
    const { who } = req.query();
    return TResponse.json({ message: `Hello, ${who}!` });
  },
);
