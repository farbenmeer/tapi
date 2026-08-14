import { use } from "react";
import { PathnameContext } from "./context";

export function usePathname() {
  return use(PathnameContext);
}
