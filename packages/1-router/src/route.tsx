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
  // Handle wildcards: *name captures as named group, * catches all without capturing
  const pattern = path
    .replaceAll(/\*(\w+)/g, "(?<$1>.+)") // *name -> named capture group
    .replaceAll(/\*/g, ".+") // * -> match everything including /
    .replaceAll(/:(\w+)/g, "(?<$1>[\\w-]+)"); // :param -> named capture group

  // If pattern contains a wildcard, it already matches everything - use exact match
  if (path.includes("*")) {
    return new RegExp(`^(${pattern})$`);
  }

  // For non-wildcard paths, allow optional trailing paths
  return new RegExp(`^(${pattern})(/.*)?$`);
}

function compileExactPathRegex(path: string): RegExp {
  if (path === "/") {
    return /^\/$/;
  }
  // Handle wildcards: *name captures as named group, * catches all without capturing
  const pattern = path
    .replaceAll(/\*(\w+)/g, "(?<$1>.+)") // *name -> named capture group
    .replaceAll(/\*/g, ".+") // * -> match everything including /
    .replaceAll(/:(\w+)/g, "(?<$1>[\\w-]+)"); // :param -> named capture group
  return new RegExp(`^(${pattern})$`);
}

function buildFullPath(parentPath: string, path?: string) {
  if (path?.startsWith("/")) {
    return path;
  }

  if (path) {
    if (parentPath === "/") {
      return "/" + path;
    }
    return parentPath + "/" + path;
  }

  return parentPath;
}
