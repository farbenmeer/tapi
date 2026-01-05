import { startTransition, useMemo, useState, type ReactNode } from "react";
import {
  HashContext,
  PathnameContext,
  RouterContext,
  SearchParamsContext,
} from "./context";
import { ImmutableSearchParams } from "./immutable-search-params";
import { removeTrailingSlash } from "./path";

interface Props {
  children: ReactNode;
  location?: {
    pathname: string;
    search: string;
    hash: string;
  };
  history?: {
    pushState: (state: any, title: string, url: string) => void;
    replaceState: (state: any, title: string, url: string) => void;
  };
}

export function Router({
  history = window.history,
  location = window.location,
  children,
}: Props) {
  const [pathname, setPathname] = useState(
    removeTrailingSlash(location.pathname)
  );
  const [searchParams, setSearchParams] = useState(
    new ImmutableSearchParams(location.search)
  );
  const [hash, setHash] = useState(location.hash);

  const routerContextValue = useMemo(
    () => ({
      push: (url: string) => {
        history.pushState(null, "", url);
        startTransition(() => {
          setPathname(removeTrailingSlash(location.pathname));
          setSearchParams(new ImmutableSearchParams(location.search));
          setHash(location.hash);
        });
      },
      replace: (url: string) => {
        history.replaceState(null, "", url);
        startTransition(() => {
          setPathname(removeTrailingSlash(location.pathname));
          setSearchParams(new ImmutableSearchParams(location.search));
          setHash(location.hash);
        });
      },
    }),
    [location, history]
  );

  return (
    <RouterContext value={routerContextValue}>
      <PathnameContext value={pathname}>
        <SearchParamsContext value={searchParams}>
          <HashContext value={hash}>{children}</HashContext>
        </SearchParamsContext>
      </PathnameContext>
    </RouterContext>
  );
}
