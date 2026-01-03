import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi().route("/env", import("./api/env"));
