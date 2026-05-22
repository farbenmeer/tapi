import { createFetchClient, type GetRoute } from "@farbenmeer/tapi/client";
import {
  createLocalClient,
  createRequestHandler,
  defineApi,
  defineHandler,
  TResponse,
} from "@farbenmeer/tapi/server";
import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { describe, expect, test } from "vitest";
import { z } from "zod/v4";
import { useQuery } from "./use-query";

describe("useQuery", () => {
  const api = defineApi()
    .route("/noQuery", {
      GET: defineHandler(
        {
          authorize: () => true,
        },
        async (req) => {
          return TResponse.json({ message: "No Query" });
        }
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
        }
      ),
    });

  const client = createLocalClient(api);

  test("Without Query", async () => {
    function Sut() {
      const data = useQuery(client.noQuery.get());
      return <div>{data.message}</div>;
    }

    await act(() =>
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <Sut />
        </Suspense>
      )
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
        </Suspense>
      )
    );

    expect(screen.getByText("Query: test")).toBeInTheDocument();
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
          </Suspense>
        )
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
          </Suspense>
        )
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
          }
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
          }
        ),
      });

      const handler = createRequestHandler(api);

      const client = createFetchClient<typeof api.routes>(
        "http://localhost:3000",
        {
          async fetch(url, init) {
            return handler(new Request(url, init));
          },
        }
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

    test("shows correct data when observable switches to an already-cached query", async () => {
      let aTitle = "Item A";

      const api = defineApi()
        .route("/a", {
          GET: defineHandler(
            { authorize: () => true },
            async () =>
              TResponse.json({ title: aTitle }, { cache: { tags: ["a"] } })
          ),
          POST: defineHandler(
            { authorize: () => true },
            async () => {
              aTitle = "Item A updated";
              return TResponse.json(null, { cache: { tags: ["a"] } });
            }
          ),
        })
        .route("/b", {
          GET: defineHandler(
            { authorize: () => true },
            async () => TResponse.json({ title: "Item B" })
          ),
        });

      const handler = createRequestHandler(api);
      const client = createFetchClient<typeof api.routes>(
        "http://localhost:3000",
        {
          async fetch(url, init) {
            return handler(new Request(url, init));
          },
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function Sut({ item }: { item: "a" | "b" }) {
        const data = useQuery(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item === "a" ? (client as any).a.get() : (client as any).b.get()
        ) as { title: string };
        return <div data-testid="sut">{data.title}</div>;
      }

      // Pre-load B into cache
      const { unmount: unmountB } = await act(() =>
        render(
          <Suspense fallback={null}>
            <Sut item="b" />
          </Suspense>
        )
      );
      unmountB();

      // Render A
      const { rerender } = await act(() =>
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <Sut item="a" />
          </Suspense>
        )
      );
      expect(screen.getByTestId("sut")).toHaveTextContent("Item A");

      // Revalidate A — this fires the subscribe callback and sets data state
      await act(async () => {
        await (client as any).a.post().revalidated;
      });
      expect(screen.getByTestId("sut")).toHaveTextContent("Item A updated");

      // Switch to B (already cached) — without the fix this showed "Item A updated"
      await act(() =>
        rerender(
          <Suspense fallback={<div>Loading...</div>}>
            <Sut item="b" />
          </Suspense>
        )
      );
      expect(screen.getByTestId("sut")).toHaveTextContent("Item B");
    });
  });
});
