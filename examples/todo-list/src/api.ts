import { defineApi } from "@toapi/server";

export const api = defineApi()
  .route("/todos", import("./api/todos"))
  .route("/todos/:id", import("./api/todo"));
