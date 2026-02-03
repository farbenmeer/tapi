import { defineHandler, TResponse } from "@farbenmeer/bunny/server";
import { db } from "db";
import z from "zod";

const params = {
  id: z.string(),
};

export const DELETE = defineHandler(
  {
    params,
    authorize: () => true,
  },
  async (req) => {
    db.prepare("DELETE FROM todos WHERE id = ?").run(req.params().id);

    return TResponse.void({
      cache: { tags: ["todos", `todo:${req.params().id}`] },
    });
  }
);

export const PATCH = defineHandler(
  {
    params,
    authorize: () => true,
    body: z.object({
      done: z.boolean(),
    }),
  },
  async (req) => {
    const { done } = await req.data();
    db.prepare("UPDATE todos SET done = ? WHERE id = ?").run(
      done ? 1 : 0,
      req.params().id
    );

    return TResponse.void({
      cache: { tags: ["todos", `todo:${req.params().id}`] },
    });
  }
);
