import { Suspense } from "react";
import type { Thenable } from "./thenable";
import { Awaited } from "./awaited";
import { useRandom } from "./rng";
import { Skeleton } from "./skeleton";

interface Props {
  children: Thenable<string>;
  minLength?: number;
  maxLength?: number;
}

export function WordSkeleton({
  children,
  minLength = 10,
  maxLength = 30,
}: Props) {
  const length = minLength + Math.round(useRandom() * (maxLength - minLength));
  return (
    <Suspense
      fallback={<Skeleton style={{ width: `${length}em`, height: `1em` }} />}
    >
      <Awaited value={children} />
    </Suspense>
  );
}
