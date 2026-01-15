import { Children, use, useMemo, type ReactElement } from "react";
import type { Route, RouteProps } from "./route";
import {
  PathnameContext,
  RouteContext,
  type RouteContextValue,
} from "./context";
import { buildFullPath, compileExactPathRegex, compilePathRegex } from "./path";

interface Props {
  children:
    | ReactElement<RouteProps, typeof Route>
    | ReactElement<RouteProps, typeof Route>[];
}

export function Switch({ children }: Props) {
  const parentRoute = use(RouteContext);
  const pathname = use(PathnameContext);
  const props = Children.map(children, (route) => route.props);

  const routeMeta = useMemo(
    () =>
      props.map((route) => {
        const path = route.path ?? "";
        const fullPath = buildFullPath(parentRoute.path, path);
        return {
          path,
          fullPath,
          pathRegex: route.exact
            ? compileExactPathRegex(fullPath)
            : compilePathRegex(fullPath),
        };
      }),
    [
      parentRoute.path,
      props.map((route) => (route.exact ? "e" : "l" + route.path)).join(" "),
    ]
  );

  const match = useMemo((): [string, RouteContextValue] | null => {
    for (const meta of routeMeta) {
      const match = pathname.match(meta.pathRegex);
      if (match)
        return [
          meta.path,
          {
            path: meta.fullPath,
            params: match?.groups ?? {},
            matchedPathname: match?.[1] ?? "",
          },
        ];
    }
    return null;
  }, [routeMeta]);

  if (!match) {
    return null;
  }

  const [path, context] = match;

  return (
    <RouteContext value={context}>
      {props.find((route) => route.path === path)?.children}
    </RouteContext>
  );
}
