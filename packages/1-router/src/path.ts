import { ImmutableSearchParams } from "./immutable-search-params";

interface Options {
  pathname: string;
  parentPathname: string;
  searchParams: ImmutableSearchParams;
}

export function resolve(
  path: string,
  { pathname, parentPathname, searchParams }: Options
) {
  if (path.startsWith("/")) {
    return path;
  }
  if (path.startsWith("?")) {
    return pathname + path;
  }
  if (path.startsWith("#")) {
    return pathname + searchParams.search + path;
  }
  if (!path) {
    return parentPathname;
  }
  return parentPathname === "/" ? `/${path}` : `${parentPathname}/${path}`;
}

export function removeTrailingSlash(path: string): string {
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

export function compilePathRegex(path: string): RegExp {
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

export function compileExactPathRegex(path: string): RegExp {
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

export function buildFullPath(parentPath: string, path?: string) {
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
