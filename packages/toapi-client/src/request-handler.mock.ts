import { createRequestHandler } from "@toapi/server";
import { api } from "./api.mock.js";

export const requestHandler = createRequestHandler(api, { basePath: "/api" });
