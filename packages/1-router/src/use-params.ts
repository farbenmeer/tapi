import { use } from "react";
import { RouteContext } from "./context";

export function useParams<
  T extends Record<string, string[]> = Record<string, string[]>
>() {
  const { params } = use(RouteContext);

  return params as T;
}
