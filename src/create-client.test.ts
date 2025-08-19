import { createClient } from "./create-client";
import type { api } from "./define-api.test";

export const client = createClient<typeof api.routes>("https://example.com");

const res = client.books.get();
const res2 = client.books["1234"]!.get({ test: "asdf" });
