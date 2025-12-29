import type { GetRoute } from "@farbenmeer/tapi/client";
import {
  createLocalClient,
  defineApi,
  defineHandler,
  TResponse,
} from "@farbenmeer/tapi/server";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Suspense } from "react";
import { z } from "zod/v4";
import { useQuery } from ".";

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
      return <div>{data.then((data) => data.message)}</div>;
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
      return <div>{data.then((data) => data.message)}</div>;
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
        return <div>{data.then((data) => data.message)}</div>;
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
        return <div>{data.message.then()}</div>;
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
});
