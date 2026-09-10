import { createFetchClient, type GetRoute } from "@toapi/client";
import {
  createRequestHandler,
  defineApi,
  defineHandler,
  TResponse,
} from "@toapi/server";
import { act, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { useQuery } from "./use-query.js";

describe("useQuery", () => {
  const api = defineApi()
    .route("/noQuery", {
      GET: defineHandler(
        {
          authorize: () => true,
        },
        async (req) => {
          return TResponse.json({ message: "No Query" });
        },
      ),
    })
    .route("/withQuery", {
      GET: defineHandler(
        {
          authorize: () => true,
          query: {
            q: z.string(),
          },
        },
        async (req) => {
          const { q } = req.query();
          return TResponse.json({ message: `Query: ${q}` });
        },
      ),
    })
    .route("/error", {
      GET: defineHandler(
        {
          authorize: () => true,
        },
        async () => {
          throw new Error("API route failed");
        },
      ),
    });

  const handler = createRequestHandler(api);
  const client = createFetchClient<typeof api.routes>("http://localhost", {
    fetch: (url, init) => handler(new Request(url, init)),
  });

  test("Without Query", async () => {
    function Sut() {
      const data = useQuery(client.noQuery.get());
      return <div>{data.message}</div>;
    }

    await act(() =>
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Sut />
        </Suspense>,
      ),
    );

    expect(screen.getByText("No Query")).toBeInTheDocument();
  });

  test("With Query", async () => {
    function Sut() {
      const data = useQuery(client.withQuery.get({ q: "test" }));
      return <div>{data.message}</div>;
    }

    await act(() =>
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Sut />
        </Suspense>,
      ),
    );

    expect(screen.getByText("Query: test")).toBeInTheDocument();
  });

  test("handles errors with an error boundary", async () => {
    const query = client.error.get();

    function Sut() {
      const data = useQuery(query);
      return <div>{data.message}</div>;
    }

    await act(() =>
      render(
        <ErrorBoundary fallback={<div>Error boundary fallback</div>}>
          <Suspense fallback={<div>Loading...</div>}>
            <Sut />
          </Suspense>
        </ErrorBoundary>,
      ),
    );

    expect(screen.getByText("Error boundary fallback")).toBeVisible();
  });

  describe("Route as Prop", () => {
    test("Without Query", async () => {
      interface Props {
        route: {
          get: GetRoute<{ message: string }>;
        };
      }
      function Sut({ route }: Props) {
        const data = useQuery(route.get());
        return <div>{data.message}</div>;
      }

      await act(() =>
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <Sut route={client.noQuery} />
          </Suspense>,
        ),
      );

      expect(screen.getByText("No Query")).toBeInTheDocument();
    });

    test("With Query", async () => {
      interface Props {
        route: {
          get: GetRoute<{ message: string }, { q: string }>;
        };
      }
      function Sut({ route }: Props) {
        const data = useQuery(route.get({ q: "test" }));
        return <div>{data.message}</div>;
      }

      await act(() =>
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <Sut route={client.withQuery} />
          </Suspense>,
        ),
      );

      expect(screen.getByText("Query: test")).toBeInTheDocument();
    });
  });

  describe("reactivity", () => {
    test("updates on revalidation", async () => {
      const things: string[] = [];

      const api = defineApi().route("/things", {
        GET: defineHandler(
          {
            authorize: () => true,
          },
          async () => {
            return TResponse.json(things, { cache: { tags: ["things"] } });
          },
        ),
        POST: defineHandler(
          {
            authorize: () => true,
            body: z.object({
              thing: z.string(),
            }),
          },
          async (req) => {
            const { thing } = await req.data();
            things.push(thing);
            return TResponse.json(null, { cache: { tags: ["things"] } });
          },
        ),
      });

      const handler = createRequestHandler(api);
      const client = createFetchClient<typeof api.routes>(
        "http://localhost:3000",
        {
          fetch: (url, init) => handler(new Request(url, init)),
        },
      );

      function Sut() {
        const data = useQuery(client.things.get());

        return <div data-testid="sut">{JSON.stringify(data)}</div>;
      }

      const screen = await act(() => render(<Sut />));

      expect(screen.getByTestId("sut")).toHaveTextContent("[]");

      await act(async () => {
        await client.things.post({ thing: "test" }).revalidated;
      });

      expect(screen.getByTestId("sut")).toHaveTextContent('["test"]');

      await act(async () => {
        await client.things.post({ thing: "foo" }).revalidated;
      });

      expect(screen.getByTestId("sut")).toHaveTextContent('["test","foo"]');
    });
  });
});
