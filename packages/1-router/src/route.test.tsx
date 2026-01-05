import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Route } from "./route";
import { useParams } from "./use-params";
import { Router } from "./router";
import { mockHistory } from "./mock-history";
import { usePathname } from "./use-pathname";

describe("Route", () => {
  describe("basic routing", () => {
    test("renders home route by default", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">Home</Route>
        </Router>
      );

      await expect.element(screen.getByText("Home")).toBeInTheDocument();
    });

    test("does not render route when path is not active", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Test Route");
    });

    test("renders route when its path is active", async () => {
      const screen = await render(
        <Router location={{ pathname: "/test", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      await expect.element(screen.getByText("Test Route")).toBeInTheDocument();
    });

    test("renders route when a subpath is active", async () => {
      const screen = await render(
        <Router location={{ pathname: "/test/asdf", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      await expect.element(screen.getByText("Test Route")).toBeInTheDocument();
    });

    test("does not render route when path segment contains extra characters", async () => {
      const screen = await render(
        <Router location={{ pathname: "/testasdf", search: "", hash: "" }}>
          <Route path="/test">Test Route</Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Test Route");
    });
  });

  describe("exact matching", () => {
    test("renders exact route when path matches exactly", async () => {
      const screen = await render(
        <Router location={{ pathname: "/test", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      await expect.element(screen.getByText("Test Route")).toBeInTheDocument();
    });

    test("does not render exact route when path does not match exactly", async () => {
      const screen = await render(
        <Router location={{ pathname: "/test/asdf", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Test Route");
    });

    test("renders exact route with trailing slash", async () => {
      const screen = await render(
        <Router location={{ pathname: "/test/", search: "", hash: "" }}>
          <Route exact path="/test">
            Test Route
          </Route>
        </Router>
      );

      await expect.element(screen.getByText("Test Route")).toBeInTheDocument();
    });
  });

  describe("nested routes", () => {
    test("renders nested routes with relative paths", async () => {
      const screen = await render(
        <Router location={{ pathname: "/parent/child", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent</div>
            <Route path="child">
              <div>Child</div>
            </Route>
          </Route>
        </Router>
      );

      await expect.element(screen.getByText("Parent")).toBeInTheDocument();
      await expect.element(screen.getByText("Child")).toBeInTheDocument();
    });

    test("renders deeply nested routes", async () => {
      const screen = await render(
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

      await expect.element(screen.getByText("Parent")).toBeInTheDocument();
      await expect.element(screen.getByText("Grandchild")).toBeInTheDocument();
      // Check that both "Child" and "Grandchild" are in the document
      const container = screen.container;
      expect(container.textContent).toContain("Child");
      expect(container.textContent).toContain("Grandchild");
    });

    test("does not render child route when parent doesn't match", async () => {
      const screen = await render(
        <Router location={{ pathname: "/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="child">
              <div>Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Parent Route");
      expect(container.textContent).not.toContain("Child Route");
    });

    test("renders parent but not child when child path doesn't match", async () => {
      const screen = await render(
        <Router location={{ pathname: "/parent/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route path="child">
              <div>Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByText("Parent Route"))
        .toBeInTheDocument();
      const container = screen.container;
      expect(container.textContent).not.toContain("Child Route");
    });

    test("handles multiple nested routes at same level", async () => {
      const screen = await render(
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

      await expect
        .element(screen.getByText("Parent Route"))
        .toBeInTheDocument();
      const container = screen.container;
      expect(container.textContent).not.toContain("First Child");
      await expect
        .element(screen.getByText("Second Child"))
        .toBeInTheDocument();
      expect(container.textContent).not.toContain("Third Child");
    });

    test("supports absolute paths in nested routes", async () => {
      const screen = await render(
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

      await expect
        .element(screen.getByText("Parent Route"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByText("Absolute Route"))
        .toBeInTheDocument();
    });

    test("nested exact routes work correctly", async () => {
      const screen = await render(
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

      await expect
        .element(screen.getByText("Parent Route"))
        .toBeInTheDocument();
      const container = screen.container;
      expect(container.textContent).not.toContain("Exact Child");
      await expect.element(screen.getByText("Child Extra")).toBeInTheDocument();
    });
  });

  describe("route parameters", () => {
    test("extracts single route parameter", async () => {
      const screen = await render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");
    });

    test("extracts multiple route parameters", async () => {
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
        .element(screen.getByTestId("param-userId"))
        .toHaveTextContent("123");
      await expect
        .element(screen.getByTestId("param-postId"))
        .toHaveTextContent("456");
    });

    test("parameters work in nested routes", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/users/123/profile", search: "", hash: "" }}
        >
          <Route path="/users/:id">
            <div>User Route</div>
            <Route path="profile">
              <ParamsDisplay />
            </Route>
          </Route>
        </Router>
      );

      await expect.element(screen.getByText("User Route")).toBeInTheDocument();
      await expect
        .element(screen.getByTestId("param-id"))
        .toHaveTextContent("123");
    });
  });

  describe("route without path prop", () => {
    test("renders route without path when parent matches", async () => {
      const screen = await render(
        <Router location={{ pathname: "/parent", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route>
              <div>Default Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByText("Parent Route"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByText("Default Child Route"))
        .toBeInTheDocument();
    });

    test("does not render route without path when parent doesn't match", async () => {
      const screen = await render(
        <Router location={{ pathname: "/other", search: "", hash: "" }}>
          <Route path="/parent">
            <div>Parent Route</div>
            <Route>
              <div>Default Child Route</div>
            </Route>
          </Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Parent Route");
      expect(container.textContent).not.toContain("Default Child Route");
    });
  });

  describe("complex nested scenarios", () => {
    test("mixed relative and absolute paths in deep nesting", async () => {
      const screen = await render(
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

      await expect.element(screen.getByText("App Layout")).toBeInTheDocument();
      await expect.element(screen.getByText("Dashboard")).toBeInTheDocument();
      await expect.element(screen.getByText("Settings")).toBeInTheDocument();
    });

    test("route with parameters and nested exact routes", async () => {
      const screen = await render(
        <Router location={{ pathname: "/users/123", search: "", hash: "" }}>
          <Route path="/users/:id">
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

      await expect
        .element(screen.getByText("User Profile"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByText("User Overview"))
        .toBeInTheDocument();
      const container = screen.container;
      expect(container.textContent).not.toContain("Edit User");
    });

    test("multiple levels of parameters", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/orgs/acme/teams/dev/members/john",
            search: "",
            hash: "",
          }}
        >
          <Route path="/orgs/:orgId">
            <Route path="teams/:teamId">
              <Route path="members/:memberId">
                <ParamsDisplay />
              </Route>
            </Route>
          </Route>
        </Router>
      );

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

  describe("wildcard routes", () => {
    test("matches wildcard route", async () => {
      const screen = await render(
        <Router location={{ pathname: "/files/a/b/c", search: "", hash: "" }}>
          <Route path="/files/*">
            <div>Files</div>
          </Route>
        </Router>
      );

      await expect.element(screen.getByText("Files")).toBeInTheDocument();
    });

    test("does not match wildcard without trailing path", async () => {
      const screen = await render(
        <Router location={{ pathname: "/files", search: "", hash: "" }}>
          <Route path="/files/*">
            <div>Files</div>
          </Route>
        </Router>
      );

      const container = screen.container;
      expect(container.textContent).not.toContain("Files");
    });

    test("extracts named wildcard parameter", async () => {
      const screen = await render(
        <Router location={{ pathname: "/files/a/b/c", search: "", hash: "" }}>
          <Route path="/files/*path">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-path"))
        .toHaveTextContent("a/b/c");
    });

    test("combines regular params with wildcard", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/api/v1/users/123", search: "", hash: "" }}
        >
          <Route path="/api/:version/*rest">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-version"))
        .toHaveTextContent("v1");
      await expect
        .element(screen.getByTestId("param-rest"))
        .toHaveTextContent("users/123");
    });

    test("wildcard matches deeply nested paths", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/docs/guide/getting-started/installation",
            search: "",
            hash: "",
          }}
        >
          <Route path="/docs/*path">
            <ParamsDisplay />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("param-path"))
        .toHaveTextContent("guide/getting-started/installation");
    });
  });

  describe("with mock history", () => {
    test("render simple route", async () => {
      const { location, history } = mockHistory("/test");

      function Sut() {
        const pathname = usePathname();
        return <div data-testid="sut">{pathname}</div>;
      }

      const screen = await render(
        <Router location={location} history={history}>
          <Route path="test">
            <Sut />
          </Route>
        </Router>
      );

      await expect
        .element(screen.getByTestId("sut"))
        .toHaveTextContent("/test");
    });
  });
});
