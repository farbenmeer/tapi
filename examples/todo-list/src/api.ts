import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi()
  .route("/todos", import("./api/todos"))
  .route("/todos/:id", import("./api/todo"));
