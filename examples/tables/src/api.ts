import { defineApi } from "@farbenmeer/tapi/server";

export const api = defineApi().route("/greet", import("./api/greet"));
