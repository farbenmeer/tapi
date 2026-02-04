import { ZodError, z } from "zod/v4";
import { HttpError } from "../shared/http-error.js";
import type { MaybePromise } from "../shared/maybe-promise.js";
import type { Path as BasePath } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import { type Cache } from "./cache.js";
import type { ApiDefinition } from "./define-api.js";
import type { Handler } from "./handler.js";
import type { TRequest } from "./t-request.js";
import { CookieStore } from "./cookie-store.js";
import { SESSION_COOKIE_NAME } from "../shared/constants.js";

interface Options {
  basePath?: string;
  hooks?: {
    error?: (error: unknown) => MaybePromise<void>;
  };
  cache?: Cache;
  defaultTTL?: number;
}

const DEFAULT_TTL = 60 * 60 * 24 * 14;
const authUsed = Symbol("TApi.authUsed");

const headersSchema = z
  .tuple([z.string(), z.string()])
  .array()
  .optional()
  .nullable();

export function createRequestHandler(
  api: ApiDefinition<Record<BasePath, MaybePromise<BaseRoute>>>,
  options: Options = {}
) {
  const errorHook =
    options.hooks?.error ??
    ((error) => {
      console.error(error);
      return error;
    });

  const basePath = options.basePath ?? "";

  const routes: { pattern: RegExp; route: MaybePromise<BaseRoute> }[] = [];

  for (const [path, route] of Object.entries(api.routes)) {
    const pattern = compilePathRegex(basePath + path);
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
          case "HEAD":
          case "GET": {
            try {
              // get matching cache entry
              const cached = await options?.cache?.get(req.url);

              if (cached) {
                // serve from cache
                const body =
                  req.method === "HEAD"
                    ? null
                    : new ReadableStream({
                        start(controller) {
                          controller.enqueue(cached.attachment);
                          controller.close();
                        },
                      });
                const headers = await headersSchema.parseAsync(cached.data);

                return new Response(body, {
                  headers: headers ?? undefined,
                });
              }
            } catch (error) {
              // caches errors while retrieving from cache
              errorHook(error);
            }

            const handler = route[req.method];
            if (!handler) return new Response("Not Found", { status: 404 });

            try {
              // execute handler, serve fresh response
              const treq = await prepareRequestWithoutBody(
                handler,
                url,
                params,
                req
              );
              const res = await executeHandler(handler, treq);

              if (res.cache) {
                if ((treq as any)[authUsed] === true) {
                  console.warn(
                    "TApi: Response specifies cache option but request handler used auth information (called req.auth()): Response will not be cached"
                  );
                } else {
                  // cache fresh response according to cache options
                  try {
                    const cloned = res.clone();
                    options?.cache
                      ?.set({
                        key: req.url,
                        data: Array.from(res.headers.entries()),
                        attachment: new Uint8Array(await cloned.arrayBuffer()),
                        ttl: res.cache.ttl ?? options.defaultTTL ?? DEFAULT_TTL,
                        tags: res.cache.tags ?? [],
                      })
                      // catches errors while caching if cache.set is async (redis cache)
                      .catch(errorHook);
                  } catch (error) {
                    // catches errors while caching if cache.set is sync (in-memory cache)
                    errorHook(error);
                  }
                }
              }
              return res;
            } catch (error) {
              // catches errors while actually handling the request
              await errorHook(error);
              return handleError(error);
            }
          }

          case "DELETE": {
            const handler = route[req.method];
            if (!handler) return new Response("Not Found", { status: 404 });
            try {
              const treq = await prepareRequestWithoutBody(
                handler,
                url,
                params,
                req
              );
              const res = await executeHandler(handler, treq);
              if (res.cache?.tags) {
                try {
                  const clientId = await treq
                    .cookies()
                    .get(SESSION_COOKIE_NAME);
                  options?.cache
                    ?.delete(
                      res.cache.tags,
                      clientId ? { clientId: clientId.value } : undefined
                    )
                    .catch(errorHook);
                } catch (error) {
                  errorHook(error);
                }
              }
              return res;
            } catch (error) {
              await errorHook(error);
              return handleError(error);
            }
          }
          case "POST":
          case "PUT":
          case "PATCH": {
            const handler = route[req.method];
            if (!handler)
              return new Response("Not Found", {
                status: 404,
                statusText: "Not Found",
              });
            try {
              const treq = await prepareRequestWithBody(
                handler,
                url,
                params,
                req
              );
              const res = await executeHandler(handler, treq);
              if (res.cache?.tags) {
                try {
                  const clientId = await treq
                    .cookies()
                    .get(SESSION_COOKIE_NAME);
                  options?.cache
                    ?.delete(
                      res.cache.tags,
                      clientId ? { clientId: clientId.value } : undefined
                    )
                    .catch(errorHook);
                } catch (error) {
                  errorHook(error);
                }
              }
              return res;
            } catch (error) {
              await errorHook(error);
              return handleError(error);
            }
          }
          default:
            return new Response("Not Found", {
              status: 404,
              statusText: "Not Found",
            });
        }
      }
    }

    return new Response("Not Found", { status: 404, statusText: "Not Found" });
  };
}

export function compilePathRegex(path: string): RegExp {
  // Handle wildcards: *name captures as named group, * catches all without capturing
  const pattern = path
    .replaceAll(/\*(\w+)/g, "(?<$1>.+)") // *name -> named capture group
    .replaceAll(/\*/g, ".+") // * -> match everything including /
    .replaceAll(/:(\w+)/g, "(?<$1>\\w+)"); // :param -> named capture group
  return new RegExp(`^${pattern}$`);
}

export async function prepareRequestWithoutBody<TBody = never>(
  handler: Handler<any, any, any, TBody>,
  url: URL,
  params: Record<string, string>,
  req: Request
) {
  const treq = req as TRequest<any, any, any, TBody>;
  treq.params = () => {
    const decodedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        decodeURIComponent(value),
      ])
    );
    if (handler.schema.params) {
      const schema = z.object(handler.schema.params);
      return schema.parse(decodedParams);
    }
    treq.params = () => decodedParams;
    return decodedParams;
  };
  treq.query = () => {
    const params = collectData(url.searchParams.entries());
    if (handler.schema.query) {
      const schema = z.object(handler.schema.query);
      return schema.parse(params);
    }
    treq.query = () => params;
    return params;
  };
  treq.cookies = () => {
    const cookieStore = new CookieStore(req);
    treq.cookies = () => cookieStore;
    return cookieStore;
  };
  const auth = await handler.schema.authorize(
    treq as TRequest<never, any, any, never>
  );

  if (!auth) {
    throw new HttpError(401, "Unauthorized");
  }

  treq.auth = () => {
    (treq as any)[authUsed] = true;
    return auth;
  };

  return treq;
}

export async function prepareRequestWithBody(
  handler: Handler<any, any, any, unknown>,
  url: URL,
  params: Record<string, string>,
  req: Request
) {
  const treq = await prepareRequestWithoutBody(handler, url, params, req);
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
    } else {
      params[key] = value;
    }
  }
  return params;
}

export async function executeHandler<Body>(
  handler: Handler<any, any, any, Body>,
  req: TRequest<any, any, any, Body>
) {
  const res = await handler.handler(req);
  if (handler.schema.response) {
    await handler.schema.response.parseAsync(res.data);
  }
  return res;
}

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(error.issues, {
      status: 400,
      headers: {
        "Content-Type": "application/json+zodissues",
      },
    });
  }
  if (error instanceof HttpError) {
    return Response.json(
      {
        message: error.message,
        data: error.data,
      },
      {
        status: error.status,
        headers: {
          "Content-Type": "application/json+httperror",
        },
      }
    );
  }
  return new Response("Internal Server Error", { status: 500 });
}
