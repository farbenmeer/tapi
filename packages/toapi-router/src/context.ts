import { createContext } from "react";
import { ImmutableSearchParams } from "./immutable-search-params.js";
import type { UseTransitionParameter } from "./transition.js";

export const PathnameContext = createContext<string>("/");

export const SearchParamsContext = createContext<ImmutableSearchParams>(
  new ImmutableSearchParams(),
);

export const HashContext = createContext<string>("");

export type RouteFunctionOptions = { useTransition?: UseTransitionParameter };

export const RouterContext = createContext<{
  push: (href: string, options?: RouteFunctionOptions) => void;
  replace: (href: string, options?: RouteFunctionOptions) => void;
}>({
  push: () => {},
  replace: () => {},
});

export interface RouteContextValue {
  path: string;
  params: Record<string, string | string[]>;
  matchedPathname: string;
}

export const RouteContext = createContext<RouteContextValue>({
  path: "/",
  params: {},
  matchedPathname: "/",
});
