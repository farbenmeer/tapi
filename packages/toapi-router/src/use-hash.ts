import { use } from "react";
import { HashContext } from "./context.js";

export function useHash() {
  return use(HashContext);
}
