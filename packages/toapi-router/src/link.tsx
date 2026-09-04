import { use, useMemo, type HTMLProps, type ReactNode } from "react";
import {
  PathnameContext,
  RouteContext,
  RouterContext,
  SearchParamsContext,
} from "./context.js";
import { resolve } from "./path.js";

interface Props extends HTMLProps<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
}

export function Link({ href, replace, children, onClick, ...rawProps }: Props) {
  const { matchedPathname: parentPathname } = use(RouteContext);
  const router = use(RouterContext);
  const pathname = use(PathnameContext);
  const searchParams = use(SearchParamsContext);

  const target = useMemo(
    () => resolve(href, { pathname, parentPathname, searchParams }),
    [href, parentPathname, pathname]
  );

  return (
    <a
      href={target}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (replace) {
          router.replace(target);
        } else {
          router.push(target);
        }
      }}
      {...rawProps}
    >
      {children}
    </a>
  );
}
