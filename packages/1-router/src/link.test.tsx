import { describe, expect, vi, test, afterEach } from "vitest";
import { render } from "vitest-browser-react";
import { Link } from "./link";
import { Route } from "./route";
import { Router } from "./router";

describe("Link", () => {
  const mockHistory = {
    pushState: vi.fn((state: any, title: string, url: string) => {}),
    replaceState: vi.fn((state: any, title: string, url: string) => {}),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    test("renders as anchor element", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <Link href="/test">Test Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toBeInTheDocument();
      expect(link.element().tagName).toBe("A");
      await expect.element(link).toHaveTextContent("Test Link");
    });

    test("sets correct href attribute", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <Link href="/test">Test Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/test");
    });

    test("passes through HTML props", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <Link
              href="/test"
              className="custom-class"
              id="test-id"
              data-testid="custom-link"
            >
              Test Link
            </Link>
          </Route>
        </Router>
      );

      const link = screen.getByTestId("custom-link");
      await expect.element(link).toHaveClass("custom-class");
      await expect.element(link).toHaveAttribute("id", "test-id");
    });
  });

  describe("href resolution", () => {
    test("handles absolute paths", async () => {
      const screen = await render(
        <Router location={{ pathname: "/current", search: "", hash: "" }}>
          <Route path="/current">
            <Link href="/absolute">Absolute Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/absolute");
    });

    test("handles relative paths from root route", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <Link href="relative">Relative Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/relative");
    });

    test("handles relative paths from nested route", async () => {
      const screen = await render(
        <Router location={{ pathname: "/parent/child", search: "", hash: "" }}>
          <Route path="/parent">
            <Route path="child">
              <Link href="sibling">Sibling Link</Link>
            </Route>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute("href", "/parent/child/sibling");
    });

    test("handles query string paths", async () => {
      const screen = await render(
        <Router location={{ pathname: "/current", search: "", hash: "" }}>
          <Route path="/current">
            <Link href="?query=value">Query Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute("href", "/current?query=value");
    });
  });

  describe("navigation behavior", () => {
    test("prevents default click behavior for internal links", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/", search: "", hash: "" }}
          history={mockHistory}
        >
          <Route path="/">
            <Link href="/test">Test Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await link.click();

      expect(mockHistory.pushState).toHaveBeenCalledWith(null, "", "/test");
    });

    test("calls router.push for regular navigation", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/", search: "", hash: "" }}
          history={mockHistory}
        >
          <Route path="/">
            <Link href="/new-page">New Page</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await link.click();

      expect(mockHistory.pushState).toHaveBeenCalledWith(null, "", "/new-page");
    });

    test("calls router.replace when replace prop is true", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/", search: "", hash: "" }}
          history={mockHistory}
        >
          <Route path="/">
            <Link href="/replace-page" replace>
              Replace Page
            </Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await link.click();

      expect(mockHistory.pushState).not.toHaveBeenCalled();
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/replace-page"
      );
    });

    test("calls custom onClick handler before navigation", async () => {
      const handleClick = vi.fn(() => {});

      const screen = await render(
        <Router
          location={{ pathname: "/", search: "", hash: "" }}
          history={mockHistory}
        >
          <Route path="/">
            <Link href="/test" onClick={handleClick}>
              Test Link
            </Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await link.click();

      expect(handleClick).toHaveBeenCalled();
      expect(mockHistory.pushState).toHaveBeenCalledWith(null, "", "/test");
    });

    test("does not navigate if custom onClick prevents default", async () => {
      const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
      };

      const screen = await render(
        <Router
          location={{ pathname: "/", search: "", hash: "" }}
          history={mockHistory}
        >
          <Route path="/">
            <Link href="/test" onClick={handleClick}>
              Test Link
            </Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await link.click();

      expect(mockHistory.pushState).not.toHaveBeenCalled();
    });
  });

  describe("nested route context", () => {
    test("resolves relative paths based on parent route context", async () => {
      const screen = await render(
        <Router
          location={{ pathname: "/users/123/profile", search: "", hash: "" }}
        >
          <Route path="/users/:id">
            <Route path="profile">
              <Link href="edit">Edit Profile</Link>
            </Route>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute("href", "/users/123/profile/edit");
    });

    test("works with deeply nested routes", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/app/dashboard/settings/profile",
            search: "",
            hash: "",
          }}
        >
          <Route path="/app">
            <Route path="dashboard">
              <Route path="settings">
                <Route path="profile">
                  <Link href="notifications">Notifications</Link>
                </Route>
              </Route>
            </Route>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute(
          "href",
          "/app/dashboard/settings/profile/notifications"
        );
    });

    test("absolute paths ignore parent route context", async () => {
      const screen = await render(
        <Router
          location={{
            pathname: "/deep/nested/route",
            search: "",
            hash: "",
          }}
        >
          <Route path="/deep">
            <Route path="nested">
              <Route path="route">
                <Link href="/absolute">Absolute Link</Link>
              </Route>
            </Route>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/absolute");
    });
  });

  describe("complex href scenarios", () => {
    test("handles relative path with query parameters", async () => {
      const screen = await render(
        <Router location={{ pathname: "/users", search: "", hash: "" }}>
          <Route path="/users">
            <Link href="create?type=admin">Create Admin</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute("href", "/users/create?type=admin");
    });

    test("handles query parameters on current page", async () => {
      const screen = await render(
        <Router location={{ pathname: "/search", search: "?q=test", hash: "" }}>
          <Route path="/search">
            <Link href="?q=new-query">New Search</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/search?q=new-query");
    });

    test("handles hash fragments", async () => {
      const screen = await render(
        <Router location={{ pathname: "/docs", search: "", hash: "" }}>
          <Route path="/docs">
            <Link href="api#methods">API Methods</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/docs/api#methods");
    });

    test("handles complex URLs with all components", async () => {
      const screen = await render(
        <Router location={{ pathname: "/base", search: "", hash: "" }}>
          <Route path="/base">
            <Link href="path/to/resource?param1=value1&param2=value2#section">
              Complex Link
            </Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect
        .element(link)
        .toHaveAttribute(
          "href",
          "/base/path/to/resource?param1=value1&param2=value2#section"
        );
    });
  });

  describe("edge cases", () => {
    test("handles empty href", async () => {
      const screen = await render(
        <Router location={{ pathname: "/current", search: "", hash: "" }}>
          <Route path="/current">
            <Link href="">Empty Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/current");
    });

    test("works in route without explicit path", async () => {
      const screen = await render(
        <Router location={{ pathname: "/parent", search: "", hash: "" }}>
          <Route path="/parent">
            <Route>
              <Link href="child">Child Link</Link>
            </Route>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/parent/child");
    });

    test("handles root route correctly", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Route path="/">
            <Link href="home">Home Link</Link>
          </Route>
        </Router>
      );

      const link = screen.getByRole("link");
      await expect.element(link).toHaveAttribute("href", "/home");
    });
  });
});
