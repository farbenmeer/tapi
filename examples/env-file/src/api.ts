import { defineApi } from "@toapi/server";

export const api = defineApi().route("/env", import("./api/env"));
