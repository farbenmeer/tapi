import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Router } from "./router";
import { useEffect } from "react";
import { useRouter } from "./use-router";
import { usePathname } from "./use-pathname";
import { useSearchParams } from "./use-search-params";
import { Route } from "./route";

describe("useRouter", () => {
  test("should change url when router.push is called", async () => {
    function Sut() {
      const router = useRouter();
      const pathname = usePathname();

      useEffect(() => {
        router.push("/new-url");
      }, []);

      return <div data-testid="sut">{pathname}</div>;
    }
    const screen = await render(
      <Router>
        <Sut />
      </Router>
    );

    expect(screen.getByTestId("sut")).toHaveTextContent("/new-url");
  });

  test("should change url when router.push is called with a query parameter", async () => {
    function Sut() {
      const router = useRouter();
      const searchParams = useSearchParams();

      useEffect(() => {
        router.push("?foo=bar");
      }, []);

      return <div data-testid="sut">{searchParams.toString()}</div>;
    }
    const screen = await render(
      <Router>
        <Sut />
      </Router>
    );

    expect(screen.getByTestId("sut")).toHaveTextContent("foo=bar");
  });

  test("should merge with parent url when relative pathname is used", async () => {
    function Redirect() {
      const router = useRouter();

      useEffect(() => {
        router.push("parent");
      }, []);

      return null;
    }

    function Sut() {
      const router = useRouter();
      const pathname = usePathname();

      useEffect(() => {
        router.push("child");
      }, []);

      return <div data-testid="sut">{pathname}</div>;
    }

    const screen = await render(
      <Router>
        <Redirect />
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
