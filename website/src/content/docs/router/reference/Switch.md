---
title: Switch
---

The `Switch` component is used to group `Route` components and render only the **first** one that matches the current URL. This is useful for exclusive routing where you want to ensure only one specific route is rendered at a time, such as picking between different page layouts or handling "Page Not Found" scenarios.

## Usage

```tsx
import { Switch, Route } from "@farbenmeer/router";

function App() {
  return (
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/about">
        <About />
      </Route>
      <Route path="/users">
        <Users />
      </Route>
    </Switch>
  );
}
```

## Props

### `children` (required)

- **Type**: `ReactElement<RouteProps> | ReactElement<RouteProps>[]`
- **Description**: A single `Route` or an array of `Route` components. The `Switch` component expects its direct children to be `Route` components to correctly extract their props (`path`, `exact`) for matching.

## Behavior

### Exclusive Matching

Unlike using multiple `Route` components directly (which render inclusively whenever they match), `Switch` looks through its children in order and stops at the **first** match.

```tsx
// Without Switch: Both might render if URL is /about (depending on exact prop)
<Route path="/">Home</Route>
<Route path="/about">About</Route>

// With Switch: Only one renders
<Switch>
  <Route path="/about">About</Route> {/* Checked first */}
  <Route path="/">Home</Route>       {/* Checked second */}
</Switch>
```

### Route Context

When a match is found, `Switch` renders the matching `Route`'s children inside a `RouteContext`. This ensures that nested components have access to the correct path parameters and matched path information.

## Examples

### 404 / Catch-All Route

Because `Switch` stops after the first match, you can place a generic route at the bottom of the list to handle any URLs that didn't match the previous routes.

```tsx
<Switch>
  <Route path="/" exact>
    <Home />
  </Route>
  <Route path="/dashboard">
    <Dashboard />
  </Route>
  {/* Matches everything else */}
  <Route>
    <NotFound />
  </Route>
</Switch>
```

### Route Ordering

Order matters significantly within a `Switch`. More specific paths should generally be placed before less specific ones.

```tsx
<Switch>
  {/* Specific path first */}
  <Route path="/users/new">
    <CreateUser />
  </Route>

  {/* Dynamic path second */}
  <Route path="/users/:id">
    <UserProfile />
  </Route>

  {/* General path last */}
  <Route path="/users">
    <UserList />
  </Route>
</Switch>
```

## Related Components

- [Route](./Route.md) - The component used to define routes within a Switch
- [Router](./Router.md) - Root router component
- [Link](./Link.md) - Navigation component