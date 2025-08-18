import type { Path as BasePath, StrictParams } from "./path";
import type { BaseRoute, Route } from "./route";

export function defineApi() {
  return new ApiDefinition({});
}

export class ApiDefinition<Routes extends Record<BasePath, unknown>> {
  constructor(public routes: Routes) {}

  route<
    Path extends BasePath,
    GetQuery extends Record<string, unknown>,
    PostQuery extends Record<string, unknown>,
    PostBody,
    PutQuery extends Record<string, unknown>,
    PutBody,
    DeleteQuery extends Record<string, unknown>,
    PathQuery extends Record<string, unknown>,
    PatchBody,
    HeadQuery extends Record<string, unknown>,
  >(
    path: Path,
    route: Route<
      StrictParams<Path>,
      GetQuery,
      PostQuery,
      PostBody,
      PutQuery,
      PutBody,
      DeleteQuery,
      PathQuery,
      PatchBody,
      HeadQuery
    >,
  ) {
    (this.routes[path] as any) = route;
    return this as unknown as ApiDefinition<
      Routes & {
        [path in Path]: Route<
          StrictParams<Path>,
          GetQuery,
          PostQuery,
          PostBody,
          PutQuery,
          PutBody,
          DeleteQuery,
          PathQuery,
          PatchBody,
          HeadQuery
        >;
      }
    >;
  }
}
