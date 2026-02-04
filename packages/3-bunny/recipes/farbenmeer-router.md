# @farbenmeer/router setup for Bunny

to setup the farbenmeer router package:

## Install the dependency:
```bash
pnpm add @farbenmeer/router
```

## Setup the router's provider
Adjust src/index.tsx so the `<App />` component is wrapped with the `<Router>`,
in the simplest case (no additional providers) src/index.tsx should look like this:

```tsx
import { startBunnyClient } from "@farbenmeer/bunny/client";
import { Router } from "@farbenmeer/router";
import { App } from "app/app";

startBunnyClient(
  <Router>
    <App />
  </Router>,
);
```

## Setup the first route
In src/app/app.tsx:

Add the necessary imports
```tsx
import { Switch, Route } from "@farbenmeer/router";
```

Add a `<Switch>` with example routes to the app-component:
```tsx
<Switch>
  <Route path="/" exact>
    <div>Home</div>
  </Route>
  <Route>
    <div>404</div>
  </Route>
</Switch>
```
