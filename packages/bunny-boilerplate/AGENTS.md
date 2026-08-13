This application uses the Bunny-Framework

## Conventions
* When creating an API route, try to use the built in parsing functions of `defineHandler`: for path params specify `params` and use `req.params()` to access them, for query params specify `query` and use `req.query()` to access them, and for json body specify `body` and use `await req.body()` to access it.
* For authorization, use functions such as `loggedInUsers` which must return a truthy value if the user is logged in. `loggedInUsers` can return a session object that can be accessed via `req.auth()` in the handler body.
* API routes should return a `TResponse`. With `TResponse.json` the response can be typed in the frontend. 
* When fetching from the API in the frontend, use the client defined in `src/client.ts`.
* Use `useQuery` from `@farbenmeer/bunny` for data fetching
* avoid type casts, if the typings from Bunny are incorrect let me know
* Prefer suspense for data fetching over custom loading state handling
* Prefer `useTransition` for loading states during mutations
* Prefer `react-error-boundary` for error handling
* Use `HttpError` from `@farbenmeer/bunny/server` to throw HTTP errors in API routes.
* For tests, use `createLocalClient` from `@farbenmeer/bunny/server` to create a TApi client that does not need network requests. Test API routes by calling the route through this local client.
* For additional tools, check out the recipes-folder. It contains instructions for how to setup tailwindcss, authentication etc.
