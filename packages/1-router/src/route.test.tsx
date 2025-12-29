import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Router } from "./router";
import { Route } from "./route";
import { useParams } from "./use-params";

describe("Route", () => {
  describe("basic routing", () => {
    test("renders home route by default", () => {
      render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">Home</Route>
        </Router>
      );

      expect(screen.getByText("Home")).toBeInTheDocument();
    });

    test("does not render route when path is not active", () => {
      render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).not.toBeInTheDocument();
    });

    test("renders route when its path is active", () => {
      render(
        <Router location={{ pathname: "/test", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).toBeInTheDocument();
    });

    test("renders route when a subpath is active", () => {
      render(
        <Router location={{ pathname: "/test/asdf", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).toBeInTheDocument();
    });

    test("does not render route when path segment contains extra characters", () => {
      render(
        <Router location={{ pathname: "/testasdf", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).not.toBeInTheDocument();
    });
  });

  describe("exact matching", () => {
    test("renders exact route when path matches exactly", () => {
      render(
        <Router location={{ pathname: "/test", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).toBeInTheDocument();
    });

    test("does not render exact route when path does not match exactly", () => {
      render(
        <Router location={{ pathname: "/test/asdf", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      expect(screen.queryByText("Test Route")).not.toBeInTheDocument();
    });

    test("renders exact route with trailing slash", () => {
      render(
        <Router location={{ pathname: "/test/", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      expect(screen.getByText("Test Route")).toBeInTheDocument();
    });
  });

  describe("nested routes", () => {
    test("renders nested routes with relative paths", () => {
      render(
        <Router location={{ pathname: "/parent/child", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent</div>
            <Route path="child">
              <div>Child</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent")).toBeInTheDocument();
      expect(screen.getByText("Child")).toBeInTheDocument();
    });

    test("renders deeply nested routes", () => {
      render(
        <Router
          location={{
            pathname: "/parent/child/grandchild",
            search: "",
            hash: "",
          }}
        >
          <Route path="/parent">
            <div>Parent</div>
            <Route path="child">
              <div>Child</div>
              <Route path="grandchild">
                <div>Grandchild</div>
              </Route>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent")).toBeInTheDocument();
      expect(screen.getByText("Child")).toBeInTheDocument();
      expect(screen.getByText("Grandchild")).toBeInTheDocument();
    });

    test("does not render child route when parent doesn't match", () => {
      render(
        <Router location={{ pathname: "/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="child">
              <div>Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.queryByText("Parent Route")).not.toBeInTheDocument();
      expect(screen.queryByText("Child Route")).not.toBeInTheDocument();
    });

    test("renders parent but not child when child path doesn't match", () => {
      render(
        <Router location={{ pathname: "/parent/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="child">
              <div>Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent Route")).toBeInTheDocument();
      expect(screen.queryByText("Child Route")).not.toBeInTheDocument();
    });

    test("handles multiple nested routes at same level", () => {
      render(
        <Router location={{ pathname: "/parent/second", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="first">
              <div>First Child</div>
            </Route>
            <Route path="second">
              <div>Second Child</div>
            </Route>
            <Route path="third">
              <div>Third Child</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent Route")).toBeInTheDocument();
      expect(screen.queryByText("First Child")).not.toBeInTheDocument();
      expect(screen.getByText("Second Child")).toBeInTheDocument();
      expect(screen.queryByText("Third Child")).not.toBeInTheDocument();
    });

    test("supports absolute paths in nested routes", () => {
      render(
        <Router
          location={{ pathname: "/parent/absolute", search: "", hash: "" }}
        >
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="/parent/absolute">
              <div>Absolute Route</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent Route")).toBeInTheDocument();
      expect(screen.getByText("Absolute Route")).toBeInTheDocument();
    });

    test("nested exact routes work correctly", () => {
      render(
        <Router
          location={{ pathname: "/parent/child/extra", search: "", hash: "" }}
        >
          <Route path="/parent">
            <div>Parent Route</div>
            <Route exact path="child">
              <div>Exact Child</div>
            </Route>
            <Route path="child/extra">
              <div>Child Extra</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent Route")).toBeInTheDocument();
      expect(screen.queryByText("Exact Child")).not.toBeInTheDocument();
      expect(screen.getByText("Child Extra")).toBeInTheDocument();
    });
  });

  describe("route parameters", () => {
    test("extracts single route parameter", () => {
      render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/[id]">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
    });

    test("extracts multiple route parameters", () => {
      render(
        <Router
          location={{ pathname: "/users/123/posts/456", search: "", hash: "" }}
        >
          <Route path="/users/[userId]/posts/[postId]">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-userId")).toHaveTextContent("123");
      expect(screen.getByTestId("param-postId")).toHaveTextContent("456");
    });

    test("parameters work in nested routes", () => {
      render(
        <Router
          location={{ pathname: "/users/123/profile", search: "", hash: "" }}
        >
          <Route path="/users/[id]">
            <div>User Route</div>
            <Route path="profile">
              <ParamsDisplay />
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("User Route")).toBeInTheDocument();
      expect(screen.getByTestId("param-id")).toHaveTextContent("123");
    });
  });

  describe("route without path prop", () => {
    test("renders route without path when parent matches", () => {
      render(
        <Router location={{ pathname: "/parent", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route>
              <div>Default Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("Parent Route")).toBeInTheDocument();
      expect(screen.getByText("Default Child Route")).toBeInTheDocument();
    });

    test("does not render route without path when parent doesn't match", () => {
      render(
        <Router location={{ pathname: "/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route>
              <div>Default Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.queryByText("Parent Route")).not.toBeInTheDocument();
      expect(screen.queryByText("Default Child Route")).not.toBeInTheDocument();
    });
  });

  describe("complex nested scenarios", () => {
    test("mixed relative and absolute paths in deep nesting", () => {
      render(
        <Router
          location={{
            pathname: "/app/dashboard/settings",
            search: "",
            hash: "",
          }}
        >
          <Route path="/app">
            <div>App Layout</div>
            <Route path="/app/dashboard">
              <div>Dashboard</div>
              <Route path="settings">
                <div>Settings</div>
              </Route>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("App Layout")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    test("route with parameters and nested exact routes", () => {
      render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/[id]">
            <div>User Profile</div>
            <Route exact path="">
              <div>User Overview</div>
            </Route>
            <Route exact path="edit">
              <div>Edit User</div>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByText("User Profile")).toBeInTheDocument();
      expect(screen.getByText("User Overview")).toBeInTheDocument();
      expect(screen.queryByText("Edit User")).not.toBeInTheDocument();
    });

    test("multiple levels of parameters", () => {
      render(
        <Router
          location={{
            pathname: "/orgs/acme/teams/dev/members/john",
            search: "",
            hash: "",
          }}
        >
          <Route path="/orgs/[orgId]">
            <Route path="teams/[teamId]">
              <Route path="members/[memberId]">
                <ParamsDisplay />
              </Route>
            </Route>
          </Route>
        </Router>
      );

      expect(screen.getByTestId("param-orgId")).toHaveTextContent("acme");
      expect(screen.getByTestId("param-teamId")).toHaveTextContent("dev");
      expect(screen.getByTestId("param-memberId")).toHaveTextContent("john");
    });
  });

  function ParamsDisplay() {
    const params = useParams();
    return (
      <div data-testid="params">
        {Object.entries(params).map(([key, value]) => (
          <span key={key} data-testid={`param-${key}`}>
            {value}
          </span>
        ))}
      </div>
    );
  }
});
