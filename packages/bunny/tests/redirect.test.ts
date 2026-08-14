import { describe, expect, test } from "vitest";
import { defineApi, defineHandler, TResponse } from "../src/server";
import { testApi } from "./test-api";

describe("Redirect", () => {
  test("handle basic redirect", async () => {
    const res = await testApi(
      defineApi().route("/redirect", {
        GET: defineHandler(
          {
            authorize: () => true,
          },
          async () =>
            TResponse.redirect("http://localhost:3000/api/redirected", 302)
        ),
      }),
      {
        url: "/api/redirect",
        method: "GET",
      }
    );

    expect(res.statusCode).toBe(302);
    expect(res.getHeader("location")).toBe(
      "http://localhost:3000/api/redirected"
    );
  });
});
