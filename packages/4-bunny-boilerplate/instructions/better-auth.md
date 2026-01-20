# better-auth Setup for Bunny

To setup [better-auth](https://better-auth.com/) with bunny:

* Add `better-auth` as a dependency

```bash
pnpm add better-auth
```

* Create your better-auth configuration file at `src/lib/auth.ts` and follow the better-auth [documentation](https://better-auth.com/docs) to configure it.

* Create your better-auth request handler at `src/api/auth.ts` as follows:

```ts
import { defineHandler } from "@farbenmeer/bunny/server";
import { auth } from "lib/auth";

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  (req) => {
    return auth.handler(req);
  },
);

export const POST = defineHandler(
  {
    authorize: () => true,
  },
  (req) => {
    return auth.handler(req);
  },
);
```

* Add the following route to your `src/api.ts` file:
```ts
.route("/auth/*", import("./api/auth"))
```

Without other modifications, your api.ts file should look like this:

```ts

import { defineApi } from "@farbenmeer/bunny/server";

export const api = defineApi()
  .route("/auth/*", import("./api/auth"))
  .route("/hello", import("./api/hello"));

```

* If not already done, add the file `src/lib/auth-client.ts` with the following content:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({});
```

Then you are ready to use better-auth with bunny.
