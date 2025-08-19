export type TRequest<Params, Query, Body> = Request & {
  params: Params;
  query: () => Query;
  data: () => Promise<Body>;
};
