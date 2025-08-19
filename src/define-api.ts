import type { Path as BasePath, StrictParams } from "./path";
import type { Route } from "./route";

export function defineApi() {
  return new ApiDefinition({});
}

export class ApiDefinition<Routes extends Record<BasePath, unknown>> {
  constructor(public routes: Routes) {}

  route<
    Path extends BasePath,
    GetResponse = never,
    GetQuery extends Record<string, unknown> = never,
    PostResponse = never,
    PostQuery extends Record<string, unknown> = never,
    PostBody = never,
  >(
    path: Path,
    route: Route<
      StrictParams<Path>,
      GetResponse,
      GetQuery,
      PostResponse,
      PostQuery,
      PostBody
    >,
  ) {
    (this.routes[path] as any) = route;
    return this as unknown as ApiDefinition<
      Routes & {
        [path in Path]: Route<
          StrictParams<Path>,
          GetResponse,
          GetQuery,
          PostResponse,
          PostQuery,
          PostBody
        >;
      }
    >;
  }
}
