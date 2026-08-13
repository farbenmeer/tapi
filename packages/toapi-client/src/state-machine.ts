import type { Observable } from "@toapi/common";

export type ObservablePromise = Promise<unknown> & Observable<unknown>;

export type Pending = {
  status: "pending";
  next: ObservablePromise;
  queued?: ObservablePromise;
};

export type Cached = {
  status: "cached";
  value: ObservablePromise;
  expiresAt?: number;
  tags: Set<string>;
};

export type Revalidating = {
  status: "revalidating";
  value: ObservablePromise;
  tags: Set<string>;
  next: ObservablePromise;
  queued?: ObservablePromise;
};

export type CacheEntryState = Pending | Cached | Revalidating;

export function init(next: ObservablePromise): Pending {
  return {
    status: "pending",
    next,
  };
}

export function revalidate(
  state: Cached,
  next: ObservablePromise,
): Revalidating {
  return {
    status: "revalidating",
    value: state.value,
    tags: state.tags,
    next,
  };
}

export function queue<S extends Revalidating | Pending>(
  state: S,
  queued: ObservablePromise,
): S {
  return {
    ...state,
    queued,
  };
}

export function resolve(
  state: Pending | Revalidating,
  value: ObservablePromise,
  tags: Set<string>,
  expiresAt?: number,
): CacheEntryState {
  if (state.next !== value) return state;

  if (state.queued) {
    return {
      status: "revalidating",
      value: state.next,
      tags: tags,
      next: state.queued,
    };
  } else {
    return {
      status: "cached",
      value: state.next,
      tags: tags,
      expiresAt: expiresAt,
    };
  }
}
