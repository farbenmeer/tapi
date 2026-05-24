import { test, expect } from "@playwright/test";

test("serves the OpenAPI spec at /api/__tapi/openapi.json", async ({
  baseURL,
}) => {
  const res = await fetch(`${baseURL}/api/__tapi/openapi.json`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("application/json");

  const spec = await res.json();

  expect(spec.openapi).toMatch(/^3\./);
  expect(spec.info).toEqual({ title: "Contact Book", version: "1.0.0" });

  expect(Object.keys(spec.paths).sort()).toEqual([
    "/contacts",
    "/contacts/{id}",
  ]);

  expect(Object.keys(spec.paths["/contacts"]).sort()).toEqual([
    "delete",
    "get",
    "post",
  ]);
  expect(Object.keys(spec.paths["/contacts/{id}"]).sort()).toEqual([
    "delete",
    "get",
    "patch",
  ]);

  const idParam = spec.paths["/contacts/{id}"].get.parameters.find(
    (p: { name: string }) => p.name === "id",
  );
  expect(idParam).toMatchObject({
    in: "path",
    name: "id",
    required: true,
    schema: { type: "string" },
  });

  const postBody =
    spec.paths["/contacts"].post.requestBody.content["application/json"].schema;
  expect(postBody.type).toBe("object");
  expect(postBody.required.sort()).toEqual(["email", "name"]);
  expect(postBody.properties.name.type).toBe("string");
  expect(postBody.properties.email.type).toBe("string");
  expect(postBody.properties.phone.type).toBe("string");
});
