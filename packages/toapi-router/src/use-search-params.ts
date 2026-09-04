import { use } from "react";
import { SearchParamsContext } from "./context.js";

export function useSearchParams() {
  return use(SearchParamsContext);
}
