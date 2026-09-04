import { use } from "react";
import { PathnameContext } from "./context.js";

export function usePathname() {
  return use(PathnameContext);
}
