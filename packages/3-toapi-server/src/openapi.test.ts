import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { api } from "./define-api.mock.js";
import { defineApi } from "./define-api.js";
import { defineHandler } from "./define-handler.js";
import { generateOpenAPISchema } from "./openapi.js";
import { TResponse } from "@toapi/common";

describe("OpenAPI", () => {
  test("generate basic OpenAPI schema", async () => {
    const schema = await generateOpenAPISchema(api, {
      info: { title: "Test API", version: "0.1.0" },
    });
    expect(schema.info.title).toBe("Test API");
    expect(schema.info.version).toBe("0.1.0");
    expect(schema.paths?.["/books"].get?.parameters).toEqual([]);

    expect(
      (schema.paths?.["/books"].post?.requestBody as any).content[
        "application/json"
      ].schema.properties.id.type
    ).toBe("string");
    expect(
      (schema.paths?.["/books"].post?.requestBody as any).content[
        "application/json"
      ].schema.properties.title.type
    ).toBe("string");
    expect(
      (schema.paths?.["/books"].post?.requestBody as any).content[
        "application/json"
      ].schema.required
    ).toEqual(["id", "title"]);

    expect(schema.paths?.["/authorized"]).toEqual({
      get: {
        parameters: [],
        responses: {
          "200": {
            description: "200 OK",
            content: {
              "application/json": {
                schema: {},
              },
            },
          },
        },
      },
    });
  });

  test("renders a full spec for an API with dynamic params, response schema, and zod metadata", async () => {
    const Widget = z
      .object({
        id: z
          .string()
          .meta({ description: "Widget identifier", example: "w_123" }),
        name: z
          .string()
          .meta({ description: "Display name", example: "Acme Widget" }),
        count: z.number().int(),
      })
      .meta({ description: "A widget resource" });

    const widgetApi = defineApi().route("/widgets/:id", {
      GET: defineHandler(
        {
          authorize: () => true,
          params: {
            id: z
              .string()
              .meta({ description: "Widget ID", example: "w_123" }),
          },
          response: Widget,
        },
        async (req) =>
          TResponse.json({
            id: req.params().id,
            name: "Acme Widget",
            count: 1,
          }),
      ),
    });

    const spec = await generateOpenAPISchema(widgetApi, {
      info: { title: "Widgets API", version: "1.0.0" },
    });

    expect(spec).toEqual({
      openapi: "3.1.1",
      info: { title: "Widgets API", version: "1.0.0" },
      paths: {
        "/widgets/{id}": {
          get: {
            parameters: [
              {
                in: "path",
                name: "id",
                schema: {
                  type: "string",
                  description: "Widget ID",
                  example: "w_123",
                },
                required: true,
                description: "Widget ID",
              },
            ],
            responses: {
              "200": {
                description: "200 OK",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Widget identifier",
                          example: "w_123",
                        },
                        name: {
                          type: "string",
                          description: "Display name",
                          example: "Acme Widget",
                        },
                        count: {
                          type: "integer",
                          minimum: -9007199254740991,
                          maximum: 9007199254740991,
                        },
                      },
                      required: ["id", "name", "count"],
                      additionalProperties: false,
                      description: "A widget resource",
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});
