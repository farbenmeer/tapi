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
