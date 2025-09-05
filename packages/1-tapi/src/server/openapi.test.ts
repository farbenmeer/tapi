import { describe, expect, test } from "bun:test";
import { api } from "./define-api.test";
import { generateOpenAPISchema } from "./openapi";

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
});
