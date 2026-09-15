import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  HashContext,
  PathnameContext,
  RouterContext,
  SearchParamsContext,
  type RouteFunctionOptions,
} from "./context.js";
import { ImmutableSearchParams } from "./immutable-search-params.js";
import { removeTrailingSlash } from "./path.js";
import { runTransition, type UseTransitionParameter } from "./transition.js";

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
  useTransition?: UseTransitionParameter;
}

export function Router({
  history = window.history,
  location = window.location,
  children,
  useTransition,
}: Props) {
  const [pathname, setPathname] = useState(
    removeTrailingSlash(location.pathname),
  );
  const [searchParams, setSearchParams] = useState(
    new ImmutableSearchParams(location.search),
  );
  const [hash, setHash] = useState(location.hash);

  useEffect(() => {
    const handlePopstate = () => {
      runTransition(useTransition, () => {
        setPathname(removeTrailingSlash(location.pathname));
        setSearchParams(new ImmutableSearchParams(location.search));
        setHash(location.hash);
      });
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [location]);

  const routerContextValue = useMemo(
    () => ({
      push: (url: string, options?: RouteFunctionOptions) => {
        history.pushState(null, "", url);
        runTransition(options?.useTransition ?? useTransition, () => {
          setPathname(removeTrailingSlash(location.pathname));
          setSearchParams(new ImmutableSearchParams(location.search));
          setHash(location.hash);
        });
      },
      replace: (url: string, options?: RouteFunctionOptions) => {
        history.replaceState(null, "", url);
        runTransition(options?.useTransition ?? useTransition, () => {
          setPathname(removeTrailingSlash(location.pathname));
          setSearchParams(new ImmutableSearchParams(location.search));
          setHash(location.hash);
        });
      },
    }),
    [location, history, useTransition],
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
