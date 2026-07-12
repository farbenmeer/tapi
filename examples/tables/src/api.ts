import { defineApi } from "@toapi/server";

export const api = defineApi().route("/greet", import("./api/greet"));
