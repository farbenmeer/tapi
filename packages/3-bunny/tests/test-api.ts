import httpMocks from "node-mocks-http";
import { ServerResponse } from "node:http";
import { vi } from "vitest";
import { ApiDefinition, createBunnyApp } from "../src/server";

export async function testApi(
  api: ApiDefinition<any>,
  requestOptions: httpMocks.RequestOptions
): Promise<ServerResponse> {
  const app = createBunnyApp({
    api: () =>
      Promise.resolve({
        api,
      }),
    dist: "./dist",
    apiInfo: {
      title: "Bunny Test API",
      version: "1.0.0",
    },
  });

  const { req, res } = httpMocks.createMocks(requestOptions);

  app(req, res);
  await vi.waitUntil(() => res.finished);

  return res;
}
