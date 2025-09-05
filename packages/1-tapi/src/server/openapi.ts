import { createDocument, type ZodOpenApiObject } from "zod-openapi";
import { ApiDefinition } from "./define-api";
import type { Path } from "../shared/path";
import type { BaseRoute } from "../shared/route";
import z from "zod/v4";
import type { MaybePromise } from "bun";

interface Options {
  info: {
    title: string;
    version: string;
  };
}

export async function generateOpenAPISchema(
  apiDefinition: ApiDefinition<Record<Path, MaybePromise<BaseRoute>>>,
  options: Options
): Promise<ReturnType<typeof createDocument>> {
  return createDocument({
    openapi: "3.1.1",
    info: options.info,
    paths: Object.fromEntries(
      await Promise.all(
        Object.entries(apiDefinition.routes).map(async ([path, route]) => [
          transformPath(path),
          Object.fromEntries(
            Object.entries(await route).map(([method, handler]) => [
              method.toLowerCase(),
              {
                requestParams: {
                  path: z.object(handler.schema.params),
                  query: z.object(handler.schema.query),
                },
                requestBody: handler.schema.body && {
                  content: {
                    "application/json": {
                      schema: handler.schema.body,
                    },
                  },
                },
                responses: {
                  "200": {
                    description: "200 OK",
                    content: {
                      "application/json": {
                        schema: handler.schema.response || z.any(),
                      },
                    },
                  },
                },
              },
            ])
          ),
        ])
      )
    ),
  });
}

function transformPath(path: string) {
  return path
    .split("/")
    .map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}"))
    .join("/");
}
