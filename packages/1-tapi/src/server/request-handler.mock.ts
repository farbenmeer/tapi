import { createRequestHandler } from "./create-request-handler";
import { api } from "./define-api.mock";

export const requestHandler = createRequestHandler(api, { basePath: "/api" });
