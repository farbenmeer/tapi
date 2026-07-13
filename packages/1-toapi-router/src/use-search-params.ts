import { use } from "react";
import { SearchParamsContext } from "./context";

export function useSearchParams() {
  return use(SearchParamsContext);
}
