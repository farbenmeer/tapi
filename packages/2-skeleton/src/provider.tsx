import type { ReactNode } from "react";
import { SkeletonContext } from "./context";

interface Props {
  children: ReactNode;
  skeletonClassName: string;
}

export function SkeletonProvider({ children, skeletonClassName }: Props) {
  return (
    <SkeletonContext value={skeletonClassName}>{children}</SkeletonContext>
  );
}
