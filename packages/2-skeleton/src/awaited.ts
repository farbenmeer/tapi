import type { Thenable } from "./thenable";
import { use } from "react";

interface Props<T> {
  value: Thenable<T>;
}

export function Awaited<T>({ value }: Props<T>) {
  return use(value.then());
}
