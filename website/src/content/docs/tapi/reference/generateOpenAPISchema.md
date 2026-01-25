---
title: generateOpenAPISchema
---

The `generateOpenAPISchema` function allows you to automatically generate an OpenAPI 3.1 specification from your `defineApi` definition. This is useful for generating documentation (like Swagger UI) or client SDKs for other languages.

## Usage

```ts
import { generateOpenAPISchema } from "@farbenmeer/tapi/server";
import { api } from "./api"; // Your ApiDefinition

async function main() {
  const openApiDoc = await generateOpenAPISchema(api, {
    info: {
      title: "My API",
      version: "1.0.0"
    }
  });

  console.log(JSON.stringify(openApiDoc, null, 2));
}

main();
```

## Signature

```ts
function generateOpenAPISchema(
  apiDefinition: ApiDefinition<Routes>,
  options: Options
): Promise<OpenAPIDocument>
```

## Parameters

### `apiDefinition`
**Type**: `ApiDefinition`

The API definition object returned by `defineApi()`.

### `options`
**Type**: `Options`

Configuration options for the OpenAPI document.

| Property | Type | Description |
| --- | --- | --- |
| `info` | `{ title: string; version: string; }` | **Required**. Metadata for the API specification. |

## Schema Mapping

The function iterates through all routes defined in your API and maps the Zod schemas from your `defineHandler` calls to OpenAPI schema objects.

| TApi Schema | OpenAPI Location |
| --- | --- |
| `params` | `parameters` (in path) |
| `query` | `parameters` (in query) |
| `body` | `requestBody` (content: application/json) |
| `response` | `responses.200` (content: application/json) |

### Path Parameter Transformation

TApi uses colon syntax (e.g., `/users/:id`) for path parameters. `generateOpenAPISchema` automatically converts this to OpenAPI curly brace syntax (e.g., `/users/{id}`).

### Response Schemas

To get the most out of the generated specification, you should provide a `response` schema in your `defineHandler` options. While TApi doesn't strictly enforce this at runtime for the response value, it is essential for describing the success response shape in the OpenAPI document.

```ts
export const GET = defineHandler({
  authorize: () => true,
  // Define response schema for OpenAPI
  response: z.object({
    id: z.string(),
    name: z.string()
  })
}, async () => {
  // ...
});
```
