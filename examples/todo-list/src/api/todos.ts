import { defineHandler, TResponse } from "@farbenmeer/bunny/server";
import { db } from "db";
import { z } from "zod";

const todo = z.object({
  id: z.number(),
  text: z.string(),
  done: z.boolean(),
});

export const GET = defineHandler(
  {
    authorize: () => true,
    response: todo.array(),
  },
  async () => {
    const todos = todo.array().parse(db.prepare("SELECT * FROM todos").all());
    return TResponse.json(todos, { tags: ["todos"] });
  }
);

export const POST = defineHandler(
  {
    authorize: () => true,
    body: z.object({
      text: z.string().min(1),
    }),
  },
  async (req) => {
    const { text } = await req.data();
    const id = db
      .prepare("INSERT INTO todos (text, done) VALUES (?, ?)")
      .run(text, 0).lastInsertRowid;
    const newTodo = todo.parse({ id });
    return TResponse.json(null, { tags: ["todos"] });
  }
);
