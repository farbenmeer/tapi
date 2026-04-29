import {
  defineApi,
  defineHandler,
  TResponse,
} from "@farbenmeer/tapi/server";
import { z } from "zod";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>vite-plugin-tapi demo</title>
  </head>
  <body>
    <h1>vite-plugin-tapi demo</h1>
    <form id="greet-form">
      <label>
        Name: <input id="name" name="name" value="world" />
      </label>
      <button type="submit">Greet</button>
    </form>
    <p id="output" data-testid="output"></p>
    <script>
      const form = document.getElementById("greet-form");
      const out = document.getElementById("output");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("name").value;
        const res = await fetch("/greet?name=" + encodeURIComponent(name));
        const data = await res.json();
        out.textContent = data.greeting;
      });
    </script>
  </body>
</html>`;

export const api = defineApi()
  .route("/", {
    GET: defineHandler({ authorize: () => true }, async () => {
      return new TResponse(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }),
  })
  .route("/greet", {
    GET: defineHandler(
      {
        authorize: () => true,
        query: { name: z.string().optional() },
      },
      async (req) => {
        const { name = "world" } = req.query();
        return TResponse.json({ greeting: `hello, ${name}` });
      },
    ),
  });
