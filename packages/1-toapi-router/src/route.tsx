import { use, useMemo } from "react";
import { PathnameContext, RouteContext } from "./context";
import { buildFullPath, compileExactPathRegex, compilePathRegex } from "./path";

export interface RouteProps {
  path?: string;
  exact?: boolean;
  children: React.ReactNode;
}

export function Route({ path, exact, children }: RouteProps) {
  const parentRoute = use(RouteContext);
  const pathname = use(PathnameContext);
  const fullPath = useMemo(
    () => buildFullPath(parentRoute.path, path ?? ""),
    [parentRoute.path, path]
  );
  const pathRegex = useMemo(
    () =>
      exact ? compileExactPathRegex(fullPath) : compilePathRegex(fullPath),
    [fullPath, exact]
  );

  const match = useMemo(() => pathname.match(pathRegex), [pathname, pathRegex]);
  const routeContextValue = useMemo(
    () => ({
      path: fullPath,
      params: match?.groups ?? {},
      matchedPathname: match?.[1] ?? "",
    }),
    [fullPath, match]
  );

  if (!match) return null;

  return <RouteContext value={routeContextValue}>{children}</RouteContext>;
}
