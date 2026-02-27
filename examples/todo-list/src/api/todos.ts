import { defineHandler, TResponse } from "@farbenmeer/bunny/server";
import { db } from "db";
import { z } from "zod";

const todo = z.object({
  id: z.number(),
  text: z.string(),
  done: z.number().transform(Boolean),
});

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    const todos = todo.array().parse(db.prepare("SELECT * FROM todos").all());
    return TResponse.json(todos, { cache: { tags: ["todos"] } });
  },
);

export const POST = defineHandler(
  {
    authorize: () => true,
  },
  async (req) => {
    const formData = await req.formData();
    const text = z.string().min(1).parse(formData.get("text"));
    db.prepare("INSERT INTO todos (text, done) VALUES (?, ?)").run(text, 0);
    return TResponse.void({ cache: { tags: ["todos"] } });
  },
);
