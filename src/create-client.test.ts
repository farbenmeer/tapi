import { createClient } from "./create-client";
import type { api } from "./define-api.test";

export const client = createClient<typeof api.routes>("https://example.com");

const res = client.fetch("/books/123/xy");
