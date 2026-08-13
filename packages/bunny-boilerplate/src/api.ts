import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi().route("/hello", import("./api/hello"));
