import { use } from "react";
import { RouterContext } from "./context";

export function useRouter() {
  return use(RouterContext);
}
