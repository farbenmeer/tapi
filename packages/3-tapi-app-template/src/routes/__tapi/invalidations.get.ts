import { defineEventHandler } from "h3";
import { streamRevalidatedTags } from "@farbenmeer/tapi/server";
import { api } from "../../api";

const buildId = process.env.BUILD_ID ?? "dev";

export default defineEventHandler(() =>
  streamRevalidatedTags({ cache: api.cache, buildId }),
);
