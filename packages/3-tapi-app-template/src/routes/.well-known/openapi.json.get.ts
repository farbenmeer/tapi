import { defineEventHandler } from "h3";
import { generateOpenAPISchema } from "@farbenmeer/tapi/server";
import { api } from "../../api";

let cached: string | undefined;

export default defineEventHandler(async (event) => {
  cached ??= JSON.stringify(
    await generateOpenAPISchema(api, {
      info: {
        title: process.env.APP_NAME ?? "tapi-app",
        version: process.env.APP_VERSION ?? "0.0.0",
      },
    }),
  );
  event.res.headers.set("Content-Type", "application/json");
  return cached;
});
