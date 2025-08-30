import { createFetchClient } from "@farbenmeer/bunny";
import { api } from "../api";

export const client = createFetchClient<typeof api.routes>("/api");
