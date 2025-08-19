import { z, ZodError } from "zod/v4";
import type { ApiDefinition } from "./define-api";
import type { Handler } from "./handler";
import { HttpError } from "./http-error";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";
import type { TRequest } from "./t-request";
import type { MaybePromise } from "bun";

interface Options {
  basePath?: string;
}

export function createRequestHandler(
  api: ApiDefinition<Record<BasePath, MaybePromise<BaseRoute>>>,
  options: Options = {},
) {
  const routes: { pattern: RegExp; route: MaybePromise<BaseRoute> }[] = [];

  for (const [path, route] of Object.entries(api.routes)) {
    const pattern = compilePathRegex((options.basePath ?? "") + path);
    routes.push({ pattern, route });
  }

  return async (req: Request) => {
    const url = new URL(req.url);

    for (const { pattern, route: routePromise } of routes) {
      const match = url.pathname.match(pattern);
      const route = await routePromise;
      if (match) {
        const params = match.groups || {};
        switch (req.method) {
          case "GET": {
            if (!route.get) return new Response("Not Found", { status: 404 });
            const treq = prepareRequestWithoutBody(route.get, url, params, req);
            return executeHandler(route.get, treq);
          }
          case "POST":
            if (!route.post) return new Response("Not Found", { status: 404 });
            const treq = prepareRequestWithBody(route.post, url, params, req);
            return executeHandler(route.post, treq);
          default:
            return new Response("Not Found", { status: 404 });
        }
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}

export function compilePathRegex(path: string): RegExp {
  return new RegExp(`^${path.replaceAll(/\[(\w+)\]/g, "(?<$1>\\w+)")}$`);
}

function prepareRequestWithoutBody<TBody = never>(
  handler: Handler<any, any, any, TBody>,
  url: URL,
  params: Record<string, string>,
  req: Request,
) {
  const treq = req as TRequest<any, any, TBody>;
  treq.params = params;
  treq.query = () => {
    const params = collectData(url.searchParams.entries());
    if (handler.schema.query) {
      const schema = z.object(handler.schema.query);
      return schema.parse(params);
    }
    return params;
  };

  return treq;
}

function prepareRequestWithBody(
  handler: Handler<any, any, any, unknown>,
  url: URL,
  params: Record<string, string>,
  req: Request,
) {
  const treq = prepareRequestWithoutBody(handler, url, params, req);
  treq.data = async () => {
    const contentType = req.headers.get("content-type");

    if (!contentType) {
      throw new HttpError(400, "Missing content-type header");
    }

    if (contentType.startsWith("application/json")) {
      const data = await req.json();
      if (handler.schema.body) {
        return handler.schema.body.parseAsync(data);
      }
      return data;
    }

    if (
      contentType.startsWith("multipart/form-data") ||
      contentType.startsWith("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      const data = collectData(formData.entries());
      if (handler.schema.body) {
        return handler.schema.body.parseAsync(data);
      }
      return data;
    }

    throw new HttpError(400, `Unsupported content-type ${contentType}`);
  };

  return treq;
}

function collectData(input: Iterable<[string, any]>) {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of input) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else if (key.endsWith("[]")) {
      params[key] = [value];
    } else {
      params[key] = value;
    }
  }
  return params;
}

async function executeHandler<Body>(
  handler: Handler<any, any, any, Body>,
  req: TRequest<any, any, Body>,
) {
  try {
    const res = await handler.handler(req);
    if (handler.schema.response) {
      await handler.schema.response.parseAsync(res.data);
    }
    return res;
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(error.message, { status: 400 });
    }
    if (error instanceof HttpError) {
      return new Response(error.message, {
        status: error.status,
      });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
