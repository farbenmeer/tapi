import { type ContextType, use, useMemo } from "react";
import {
  PathnameContext,
  RouteContext,
  RouterContext,
  SearchParamsContext,
} from "./context";
import { resolve } from "./path";

export function useRouter(): ContextType<typeof RouterContext> {
  const { push, replace } = use(RouterContext);
  const { matchedPathname: parentPathname } = use(RouteContext);
  const pathname = use(PathnameContext);
  const searchParams = use(SearchParamsContext);

  return useMemo(
    () => ({
      push(href) {
        push(
          resolve(href, {
            pathname,
            searchParams,
            parentPathname,
          })
        );
      },
      replace(href) {
        replace(
          resolve(href, {
            pathname,
            searchParams,
            parentPathname,
          })
        );
      },
    }),
    [pathname, searchParams, parentPathname]
  );
}
