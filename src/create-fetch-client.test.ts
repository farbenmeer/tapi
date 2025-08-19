import { createFetchClient } from "./create-fetch-client";
import type { api } from "./define-api.test";

export const client = createFetchClient<typeof api.routes>(
  "https://example.com",
);
