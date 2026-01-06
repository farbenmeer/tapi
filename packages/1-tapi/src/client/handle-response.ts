import { ZodError } from "zod";
import { HttpError } from "../shared/http-error.js";

export async function handleResponse(res: Response) {
  switch (res.status) {
    case 200:
      return parseBody(res);

    // @ts-expect-error explicit fallthrough
    case 400:
      if (res.headers.get("Content-Type") === "application/json+zodissues") {
        const issues = await res.json();
        return new ZodError(issues);
      }

    default:
      if (res.headers.get("Content-Type") === "application/json+httperror") {
        const { message, data } = await res.json();
        throw new HttpError(res.status, message, data);
      }
      throw new HttpError(res.status, res.statusText);
  }
}

async function parseBody(res: Response) {
  const contentType = res.headers.get("Content-Type");

  switch (contentType) {
    case "application/json":
      return await res.json();
    case "text/plain":
      return await res.text();
    default:
      throw new Error(`Tapi: Unsupported content type: ${contentType}`);
  }
}
