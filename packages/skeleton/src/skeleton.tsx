import { use, type CSSProperties } from "react";
import { SkeletonContext } from "./context";

interface Props {
  style: CSSProperties;
}

export function Skeleton({ style }: Props) {
  const skeletonClassName = use(SkeletonContext);
  return <span className={skeletonClassName} style={style} />;
}
