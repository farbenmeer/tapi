import { createContext } from "react";
import { ImmutableSearchParams } from "./immutable-search-params";

export const PathnameContext = createContext<string>("/");

export const SearchParamsContext = createContext<ImmutableSearchParams>(
  new ImmutableSearchParams()
);

export const HashContext = createContext<string>("");

export const RouterContext = createContext<{
  push: (href: string) => void;
  replace: (href: string) => void;
}>({
  push: () => {},
  replace: () => {},
});

export const RouteContext = createContext<{
  path: string;
  params: Record<string, string | string[]>;
  matchedPathname: string;
}>({
  path: "/",
  params: {},
  matchedPathname: "/",
});
