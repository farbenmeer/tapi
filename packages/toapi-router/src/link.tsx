import { use, useMemo, type HTMLProps } from "react";
import {
  PathnameContext,
  RouteContext,
  RouterContext,
  SearchParamsContext,
} from "./context.js";
import { resolve } from "./path.js";
import { runTransition, type UseTransitionParameter } from "./transition.js";

interface Props extends HTMLProps<HTMLAnchorElement> {
  href: string;
  replace?: boolean;
  useTransition?: UseTransitionParameter;
}

export function Link({
  href,
  replace,
  children,
  useTransition,
  onClick,
  ...rawProps
}: Props) {
  const { matchedPathname: parentPathname } = use(RouteContext);
  const router = use(RouterContext);
  const pathname = use(PathnameContext);
  const searchParams = use(SearchParamsContext);

  const target = useMemo(
    () => resolve(href, { pathname, parentPathname, searchParams }),
    [href, parentPathname, pathname],
  );

  return (
    <a
      href={target}
      onClick={(event) => {
        runTransition(useTransition, () => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (replace) {
            router.replace(target, { useTransition: false });
          } else {
            router.push(target, { useTransition: false });
          }
        });
        event.preventDefault();
      }}
      {...rawProps}
    >
      {children}
    </a>
  );
}
