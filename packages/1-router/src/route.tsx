import { use, useMemo } from "react";
import { PathnameContext, RouteContext } from "./context";

interface Props {
  path?: string;
  exact?: boolean;
  children: React.ReactNode;
}

export function Route({ path, exact, children }: Props) {
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

function compilePathRegex(path: string): RegExp {
  if (path === "/") {
    return /^\//;
  }
  return new RegExp(
    `^(${path.replaceAll(/\[(\w+)\]/g, "(?<$1>[\\w-]+)")})(/.*)?$`
  );
}

function compileExactPathRegex(path: string): RegExp {
  if (path === "/") {
    return /^\/$/;
  }
  return new RegExp(`^(${path.replaceAll(/\[(\w+)\]/g, "(?<$1>[\\w-]+)")})$`);
}

function buildFullPath(parentPath: string, path?: string) {
  if (path?.startsWith("/")) {
    return path;
  }

  if (path) {
    return parentPath + "/" + path;
  }

  return parentPath;
}
