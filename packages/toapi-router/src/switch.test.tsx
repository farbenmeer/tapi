import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Route } from "./route.js";
import { useParams } from "./use-params.js";
import { Router } from "./router.js";
import { mockHistory } from "./mock-history.js";
import { usePathname } from "./use-pathname.js";
import { Switch } from "./switch.js";

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
          <Switch>
            <Route path="/foo">Foo</Route>
            <Route path="/bar">Bar</Route>
            <Route path="/bar">Baz</Route>
          </Switch>
        </Router>
      );

      await expect.element(screen.getByText("Bar")).toBeInTheDocument();
      await expect.element(screen.queryByText("Baz")).not.toBeInTheDocument();
    });

    test("renders route without path as fallback", async () => {
      const screen = await render(
        <Router location={{ pathname: "/baz", search: "", hash: "" }}>
          <Switch>
            <Route path="/foo">Foo</Route>
            <Route path="/bar">Bar</Route>
            <Route>Baz</Route>
          </Switch>
        </Router>
      );

      await expect.element(screen.container).toHaveTextContent("Baz");
    });
  });
});
