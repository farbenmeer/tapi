import { defineApi } from "@farbenmeer/bunny/server";
import { InMemoryCache } from "@farbenmeer/tag-based-cache/in-memory-cache";

export const cache = new InMemoryCache();

export const api = defineApi()
  .route("/contacts", import("./api/contacts"))
  .route("/contacts/:id", import("./api/contact"));
