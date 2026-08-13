export type ApiHandler = (request: Request) => Promise<Response> | Response;
