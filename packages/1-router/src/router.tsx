import { startTransition, useMemo, useState, type ReactNode } from "react";
import {
  HashContext,
  PathnameContext,
  RouterContext,
  SearchParamsContext,
} from "./context";
import { ImmutableSearchParams } from "./immutable-search-params";

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

export function Router(props: Props) {
  const [pathname, setPathname] = useState(
    removeTrailingSlash(props.location?.pathname ?? window.location.pathname)
  );
  const [search, setSearch] = useState(
    props.location?.search ?? window.location.search
  );
  const [hash, setHash] = useState(
    props.location?.hash ?? window.location.hash
  );
  const searchParams = useMemo(
    () => new ImmutableSearchParams(props.location?.search ?? search),
    [props.location?.search, search]
  );

  const routerContextValue = useMemo(
    () => ({
      push: (url: string) => {
        (props.history ?? window.history).pushState(null, "", url);
        if (!props.location) {
          startTransition(() => {
            setPathname(removeTrailingSlash(window.location.pathname));
            setSearch(window.location.search);
            setHash(window.location.hash);
          });
        }
      },
      replace: (url: string) => {
        (props.history ?? window.history).replaceState(null, "", url);
        if (!props.location) {
          startTransition(() => {
            setPathname(removeTrailingSlash(window.location.pathname));
            setSearch(window.location.search);
            setHash(window.location.hash);
          });
        }
      },
    }),
    []
  );

  return (
    <RouterContext value={routerContextValue}>
      <PathnameContext
        value={
          props.location?.pathname
            ? removeTrailingSlash(props.location.pathname)
            : pathname
        }
      >
        <SearchParamsContext value={searchParams}>
          <HashContext value={hash}>{props.children}</HashContext>
        </SearchParamsContext>
      </PathnameContext>
    </RouterContext>
  );
}

function removeTrailingSlash(path: string): string {
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}
