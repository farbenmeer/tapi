import { createFetchClient } from "@toapi/client";
import type { api } from "./api";

export const client = createFetchClient<(typeof api)["routes"]>("/api");
