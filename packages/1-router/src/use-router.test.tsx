import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Router } from "./router";
import { useEffect } from "react";
import { useRouter } from "./use-router";
import { usePathname } from "./use-pathname";
import { useSearchParams } from "./use-search-params";
import { Route } from "./route";
import { mockHistory } from "./mock-history";

describe("useRouter", () => {
  test("should change url when router.push is called", async () => {
    const { location, history } = mockHistory();

    function Sut() {
      const router = useRouter();
      const pathname = usePathname();

      useEffect(() => {
        router.push("/new-url");
      }, []);

      return <div data-testid="sut">{pathname}</div>;
    }
    const screen = await render(
      <Router history={history} location={location}>
        <Sut />
      </Router>
    );

    expect(screen.getByTestId("sut")).toHaveTextContent("/new-url");
  });

  test("should change url when router.push is called with a query parameter", async () => {
    const { location, history } = mockHistory();

    function Sut() {
      const router = useRouter();
      const searchParams = useSearchParams();

      useEffect(() => {
        router.push("?foo=bar");
      }, []);

      return <div data-testid="sut">{searchParams.toString()}</div>;
    }
    const screen = await render(
      <Router history={history} location={location}>
        <Sut />
      </Router>
    );

    expect(screen.getByTestId("sut")).toHaveTextContent("foo=bar");
  });

  test("should merge with parent url when relative pathname is used", async () => {
    const { location, history } = mockHistory("/parent");

    function Sut() {
      const router = useRouter();
      const pathname = usePathname();

      useEffect(() => {
        router.push("child");
      }, []);

      return <div data-testid="sut">{pathname}</div>;
    }

    const screen = await render(
      <Router location={location} history={history}>
        <Route path="parent">
          <Sut />
        </Route>
      </Router>
    );

    await expect
      .element(screen.getByTestId("sut"))
      .toHaveTextContent("/parent/child");
  });
});
