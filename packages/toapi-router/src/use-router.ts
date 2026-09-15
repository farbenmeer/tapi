import { type ContextType, use, useMemo } from "react";
import {
  PathnameContext,
  RouteContext,
  RouterContext,
  SearchParamsContext,
} from "./context.js";
import { resolve } from "./path.js";

export function useRouter(): ContextType<typeof RouterContext> {
  const { push, replace } = use(RouterContext);
  const { matchedPathname: parentPathname } = use(RouteContext);
  const pathname = use(PathnameContext);
  const searchParams = use(SearchParamsContext);

  return useMemo(
    () => ({
      push(href, options) {
        push(
          resolve(href, {
            pathname,
            searchParams,
            parentPathname,
          }),
          options,
        );
      },
      replace(href, options) {
        replace(
          resolve(href, {
            pathname,
            searchParams,
            parentPathname,
          }),
          options,
        );
      },
    }),
    [pathname, searchParams, parentPathname, push, replace],
  );
}
