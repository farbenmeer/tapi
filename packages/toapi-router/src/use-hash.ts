import { use } from "react";
import { HashContext } from "./context";

export function useHash() {
  return use(HashContext);
}
