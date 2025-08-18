import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";

export function createClient<Routes extends Record<BasePath, BaseRoute>>(
  baseUrl: string,
) {
  return new Client<Routes>(baseUrl);
}

class Client<Routes extends Record<BasePath, BaseRoute>> {
  constructor(private baseUrl: string) {}

  fetch<RoutePath extends keyof Routes>(path: ReadFrom<RoutePath>) {}
}

type ReadFrom<Path> = Path extends `${infer Segment}[${infer Rest}`
  ? `${Segment}${string}${ReadUntil<Rest>}`
  : Path;

type ReadUntil<Path> = Path extends `${string}]${infer Rest}`
  ? ReadFrom<Rest>
  : never;

type GetPaths<Routes extends Record<BasePath, BaseRoute>> = keyof {
  [key in keyof Routes]: Routes[key] extends { get: any } ? key : never;
};
