export type TRequest<Params, Query, Body> = Request & {
  params: () => Params;
  query: () => Query;
  body: () => Promise<Body>;
};
