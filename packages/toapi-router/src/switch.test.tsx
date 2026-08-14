import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Route } from "./route";
import { useParams } from "./use-params";
import { Router } from "./router";
import { mockHistory } from "./mock-history";
import { usePathname } from "./use-pathname";
import { Switch } from "./switch";

describe("Switch", () => {
  describe("basic routing", () => {
    test("renders home route by default", async () => {
      const screen = await render(
        <Router location={{ pathname: "/", search: "", hash: "" }}>
          <Switch>
            <Route path="/">Home</Route>
          </Switch>
        </Router>
      );

      await expect.element(screen.getByText("Home")).toBeInTheDocument();
    });

    test("renders first matching route", async () => {
      const screen = await render(
        <Router location={{ pathname: "/bar", search: "", hash: "" }}>
          <Route path="/foo">Foo</Route>
          <Route path="/bar">Bar</Route>
          <Route path="/bar">Baz</Route>
        </Router>
      );

      const container = screen.container;
      expect(container).toHaveTextContent("Bar");
    });

    test("renders route without path as fallback", async () => {
      const screen = await render(
        <Router location={{ pathname: "/baz", search: "", hash: "" }}>
          <Route path="/foo">Foo</Route>
          <Route path="/bar">Bar</Route>
          <Route>Baz</Route>
        </Router>
      );

      await expect.element(screen.container).toHaveTextContent("Baz");
    });
  });
});
