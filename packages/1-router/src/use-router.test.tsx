import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Router } from "./router";
import { useEffect } from "react";
import { useRouter } from "./use-router";
import { usePathname } from "./use-pathname";
import { useSearchParams } from "./use-search-params";

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
});
