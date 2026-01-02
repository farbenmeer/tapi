import { useId } from "react";

export function useRandom() {
  const id = useId();

  // Convert the React ID string to a hash number
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a value between 0 and 1
  return Math.abs(hash) / 2147483647;
}
