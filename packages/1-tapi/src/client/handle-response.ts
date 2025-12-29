import { HttpError } from "../shared/http-error.js";

export function handleResponse(res: Response) {
  switch (res.status) {
    case 200:
      return parseBody(res);
    default:
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
