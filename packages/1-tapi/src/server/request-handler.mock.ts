import { createRequestHandler } from "./create-request-handler.js";
import { api } from "./define-api.mock.js";

export const requestHandler = createRequestHandler(api, { basePath: "/api" });
