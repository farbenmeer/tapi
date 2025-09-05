import { createFetchClient } from "@farbenmeer/bunny/client";
import { api } from "../api";

export const client = createFetchClient<typeof api.routes>("/api");
