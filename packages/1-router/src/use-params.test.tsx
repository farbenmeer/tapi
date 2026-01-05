import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Router } from "./router";
import { Route } from "./route";
import { useParams } from "./use-params";
import { mockHistory } from "./mock-history";
import { Link } from "./link";

describe("useParams", () => {
  function ParamsDisplay() {
    const params = useParams();
    return (
      <div>
        <div data-testid="params-count">{Object.keys(params).length}</div>
        {Object.entries(params).map(([key, value]) => (
          <div key={key} data-testid={`param-${key}`}>
            {Array.isArray(value) ? value.join(",") : value}
          </div>
        ))}
      </div>
    );
  }

  describe("basic parameter extraction", () => {
    test("returns empty object when no parameters", async () => {
      const screen = await render(
        <Router location={{ pathname: "/static", search: "", hash: "" }}>
          <Route path="/static">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("0");
    });

    test("extracts single parameter", async () => {
      const screen = await render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("1");
      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");
    });

    test("extracts multiple parameters", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/users/123/posts/456", search: "", hash: "" }}
        >
          <Route path="/users/:userId/posts/:postId">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("2");
      await expect
        .element(screen.getByTestId("param-userId"))
        .toHaveTextContent("123");
      await expect
        .element(screen.getByTestId("param-postId"))
        .toHaveTextContent("456");
    });

    test("handles alphanumeric parameters", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/products/abc123", search: "", hash: "" }}
        >
          <Route path="/products/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-slug"))
        .toHaveTextContent("abc123");
    });
  });

  describe("nested route parameters", () => {
    test("inherits parameters from parent route", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/users/123/profile", search: "", hash: "" }}
        >
          <Route path="/users/:id">
            <Route path="profile">
              <ParamsDisplay />
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("1");
      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");
    });

    test("combines parent and child parameters", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/orgs/acme/teams/dev", search: "", hash: "" }}
        >
          <Route path="/orgs/:orgId">
            <Route path="teams/:teamId">
              <ParamsDisplay />
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("2");
      await expect
        .element(screen.getByTestId("param-orgId"))
        .toHaveTextContent("acme");
      await expect
        .element(screen.getByTestId("param-teamId"))
        .toHaveTextContent("dev");
    });

    test("works with deeply nested routes", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/api/v1/orgs/acme/teams/dev/members/john",
            search: "",
            hash: "",
          }}
        >
          <Route path="/api/v1/orgs/:orgId">
            <Route path="teams/:teamId">
              <Route path="members/:memberId">
                <ParamsDisplay />
              </Route>
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("3");
      await expect
        .element(screen.getByTestId("param-orgId"))
        .toHaveTextContent("acme");
      await expect
        .element(screen.getByTestId("param-teamId"))
        .toHaveTextContent("dev");
      await expect
        .element(screen.getByTestId("param-memberId"))
        .toHaveTextContent("john");
    });
  });

  describe("parameter types and formats", () => {
    test("handles numeric-looking parameters as strings", async () => {
      const screen = await render(
        <Router location={{ pathname: "/items/12345", search: "", hash: "" }}>
          <Route path="/items/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("12345");
    });

    test("handles UUID-style parameters", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/resources/550e8400-e29b-41d4-a716-446655440000",
            search: "",
            hash: "",
          }}
        >
          <Route path="/resources/:uuid">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-uuid"))
        .toHaveTextContent("550e8400-e29b-41d4-a716-446655440000");
    });

    test("handles hyphenated parameters", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/posts/my-blog-post", search: "", hash: "" }}
        >
          <Route path="/posts/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-slug"))
        .toHaveTextContent("my-blog-post");
    });
  });

  describe("route context isolation", () => {
    test("parameters are isolated between different route contexts", async () => {
      function DualRouteTest() {
        return (
          <div>
            <Route path="/users/:id">
              <div data-testid="user-route">
                <ParamsDisplay />
              </div>
            </Route>
            <Route path="/posts/:slug">
              <div data-testid="post-route">
                <ParamsDisplay />
              </div>
            </Route>
          </div>
        );
      }

      const screen = await render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <DualRouteTest />
        </Router>
      );

      const userRoute = screen.getByTestId("user-route");
      const userParamsCount = userRoute
        .element()
        .querySelector('[data-testid="params-count"]');
      const userId = userRoute
        .element()
        .querySelector('[data-testid="param-id"]');

      expect(userParamsCount?.textContent).toBe("1");
      expect(userId?.textContent).toBe("123");
      const container = screen.container;
      expect(container.querySelector('[data-testid="post-route"]')).toBeNull();
    });
  });

  describe("edge cases", () => {
    test("handles empty parameter values", async () => {
      const screen = await render(
        <Router location={{ pathname: "/users/", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      // This should not match due to the regex pattern
      const container = screen.container;
      expect(
        container.querySelector('[data-testid="params-count"]')
      ).toBeNull();
    });

    test("handles route without parameters in nested context", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/users/123/settings", search: "", hash: "" }}
        >
          <Route path="/users/:id">
            <Route path="settings">
              <ParamsDisplay />
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("1");
      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");
    });

    test("works at root route level", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("params-count"))
        .toHaveTextContent("0");
    });
  });

  describe("parameter reactivity", () => {
    test("updates when route parameters change", async () => {
      const { history, location } = mockHistory("/users/123");

      const screen = await render(
        <Router location={location} history={history}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
          <Link href="/users/456">To User 456</Link>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");

      await screen.getByText("To User 456").click();

      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("456");
    });

    test("updates when switching between routes with different parameters", async () => {
      const { history, location } = mockHistory("/users/123");

      const screen = await render(
        <Router location={location} history={history}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
          <Route path="/posts/:slug">
            <ParamsDisplay />
          </Route>
          <Link href="/posts/hello-world">Go to post</Link>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-id"), { timeout: 100 })
        .toHaveTextContent("123");
      expect(
        screen.container.querySelector('[data-testid="param-slug"]')
      ).toBeNull();

      await screen.getByText("Go to post").click({ timeout: 100 });

      expect(
        screen.container.querySelector('[data-testid="param-id"]')
      ).toBeNull();
      await expect
        .element(screen.getByTestId("param-slug"), { timeout: 100 })
        .toHaveTextContent("hello-world");
    });
  });
});
