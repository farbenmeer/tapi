import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Router } from "./router";
import { Route } from "./route";
import { useParams } from "./use-params";

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
    test("returns empty object when no parameters", () => {
      render(
        <Router location={{ pathname: "/static", search: "", hash: "" }}>
          <Route path="/static">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("params-count")).toHaveTextContent("0");
    });

    test("extracts single parameter", () => {
      render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("params-count")).toHaveTextContent("1");
      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
    });

    test("extracts multiple parameters", () => {
      render(
        <Router
          location={{ pathname: "/users/123/posts/456", search: "", hash: "" }}
        >
          <Route path="/users/:userId/posts/:postId">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("params-count")).toHaveTextContent("2");
      expect(screen.getByTestId("param-userId")).toHaveTextContent("123");
      expect(screen.getByTestId("param-postId")).toHaveTextContent("456");
    });

    test("handles alphanumeric parameters", () => {
      render(
        <Router
          location={{ pathname: "/products/abc123", search: "", hash: "" }}
        >
          <Route path="/products/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-slug")).toHaveTextContent("abc123");
    });
  });

  describe("nested route parameters", () => {
    test("inherits parameters from parent route", () => {
      render(
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

      expect(screen.getByTestId("params-count")).toHaveTextContent("1");
      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
    });

    test("combines parent and child parameters", () => {
      render(
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

      expect(screen.getByTestId("params-count")).toHaveTextContent("2");
      expect(screen.getByTestId("param-orgId")).toHaveTextContent("acme");
      expect(screen.getByTestId("param-teamId")).toHaveTextContent("dev");
    });

    test("works with deeply nested routes", () => {
      render(
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

      expect(screen.getByTestId("params-count")).toHaveTextContent("3");
      expect(screen.getByTestId("param-orgId")).toHaveTextContent("acme");
      expect(screen.getByTestId("param-teamId")).toHaveTextContent("dev");
      expect(screen.getByTestId("param-memberId")).toHaveTextContent("john");
    });
  });

  describe("parameter types and formats", () => {
    test("handles numeric-looking parameters as strings", () => {
      render(
        <Router location={{ pathname: "/items/12345", search: "", hash: "" }}>
          <Route path="/items/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-id")).toHaveTextContent("12345");
    });

    test("handles UUID-style parameters", () => {
      render(
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

      expect(screen.getByTestId("param-uuid")).toHaveTextContent(
        "550e8400-e29b-41d4-a716-446655440000"
      );
    });

    test("handles hyphenated parameters", () => {
      render(
        <Router
          location={{ pathname: "/posts/my-blog-post", search: "", hash: "" }}
        >
          <Route path="/posts/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-slug")).toHaveTextContent(
        "my-blog-post"
      );
    });
  });

  describe("route context isolation", () => {
    test("parameters are isolated between different route contexts", () => {
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

      render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <DualRouteTest />
        </Router>
      );

      const userRoute = screen.getByTestId("user-route");
      const userParamsCount = userRoute.querySelector(
        '[data-testid="params-count"]'
      );
      const userId = userRoute.querySelector('[data-testid="param-id"]');

      expect(userParamsCount).toHaveTextContent("1");
      expect(userId).toHaveTextContent("123");
      expect(screen.queryByTestId("post-route")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    test("handles empty parameter values", () => {
      render(
        <Router location={{ pathname: "/users/", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      // This should not match due to the regex pattern
      expect(screen.queryByTestId("params-count")).not.toBeInTheDocument();
    });

    test("handles route without parameters in nested context", () => {
      render(
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

      expect(screen.getByTestId("params-count")).toHaveTextContent("1");
      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
    });

    test("works at root route level", () => {
      render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("params-count")).toHaveTextContent("0");
    });
  });

  describe("parameter reactivity", () => {
    test("updates when route parameters change", () => {
      const { rerender } = render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-id")).toHaveTextContent("123");

      rerender(
        <Router location={{ pathname: "/users/456", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-id")).toHaveTextContent("456");
    });

    test("updates when switching between routes with different parameters", () => {
      const { rerender } = render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
          <Route path="/posts/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
      expect(screen.queryByTestId("param-slug")).not.toBeInTheDocument();

      rerender(
        <Router
          location={{ pathname: "/posts/hello-world", search: "", hash: "" }}
        >
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
          <Route path="/posts/:slug">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.queryByTestId("param-id")).not.toBeInTheDocument();
      expect(screen.getByTestId("param-slug")).toHaveTextContent("hello-world");
    });
  });
});
