import { defineApi } from "@farbenmeer/bunny/server";
import { InMemoryCache } from "@farbenmeer/tag-based-cache/in-memory-cache";

const cache = new InMemoryCache();

export const api = defineApi({
  cache,
  oas: { title: "Contact Book", version: "1.0.0" },
})
  .route("/contacts", import("./api/contacts"))
  .route("/contacts/:id", import("./api/contact"));
