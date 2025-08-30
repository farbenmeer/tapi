import { defineApi } from "@farbenmeer/bunny";

export const api = defineApi().route("/hello", import("./api/hello"));
