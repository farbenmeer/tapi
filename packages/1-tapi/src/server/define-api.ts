import type { MaybePromise } from "../shared/maybe-promise.js";
import type { Path as BasePath, StrictParams } from "../shared/path.js";
import type { Route } from "../shared/route.js";

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
    DeleteResponse = never,
    DeleteQuery extends Record<string, unknown> = never,
    PutResponse = never,
    PutQuery extends Record<string, unknown> = never,
    PutBody = never,
    PatchResponse = never,
    PatchQuery extends Record<string, unknown> = never,
    PatchBody = never
  >(
    path: Path,
    route: MaybePromise<
      Route<
        StrictParams<Path>,
        GetResponse,
        GetQuery,
        PostResponse,
        PostQuery,
        PostBody,
        DeleteResponse,
        DeleteQuery,
        PutResponse,
        PutQuery,
        PutBody,
        PatchResponse,
        PatchQuery,
        PatchBody
      >
    >
  ) {
    (this.routes[path] as any) = route;
    return this as unknown as ApiDefinition<
      Routes & {
        [path in Path]: MaybePromise<
          Route<
            StrictParams<Path>,
            GetResponse,
            GetQuery,
            PostResponse,
            PostQuery,
            PostBody,
            DeleteResponse,
            DeleteQuery,
            PutResponse,
            PutQuery,
            PutBody,
            PatchResponse,
            PatchQuery,
            PatchBody
          >
        >;
      }
    >;
  }
}
