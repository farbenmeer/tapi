import { createFetchClient } from "@farbenmeer/tapi/client";
import type { api } from "./api";

export const client = createFetchClient<typeof api.routes>("/api");
