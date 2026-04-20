import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi().route("/hello", import("./handlers/hello"));
