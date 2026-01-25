---
title: Router
---

The `Router` component is the root component that provides routing context to your application. It manages the current location state and provides navigation methods.

## Usage

```tsx
import { Router } from "@farbenmeer/router";

function App() {
  return (
    <Router>
      <Route path="/">
        <h1>Home</h1>
      </Route>
      <Route path="/about">
        <h1>About</h1>
      </Route>
    </Router>
  );
}
```

## Props

### `children` (required)

- **Type**: `ReactNode`
- **Description**: The application components that will have access to the router context.

### `location` (optional)

- **Type**: `{ pathname: string; search: string; hash: string }`
- **Description**: Override the current location instead of using `window.location`. Useful for testing or server-side rendering.
- **Default**: Uses `window.location`

```tsx
// Example: Testing with custom location
<Router location={{ pathname: "/test", search: "?foo=bar", hash: "#section" }}>
  <App />
</Router>
```

### `history` (optional)

- **Type**: `{ pushState: (state: any, title: string, url: string) => void; replaceState: (state: any, title: string, url: string) => void }`
- **Description**: Override the history implementation instead of using `window.history`. Useful for testing or custom navigation handling.
- **Default**: Uses `window.history`

```tsx
// Example: Custom history implementation
const customHistory = {
  pushState: (state, title, url) => {
    console.log(`Navigating to: ${url}`);
    window.history.pushState(state, title, url);
  },
  replaceState: (state, title, url) => {
    console.log(`Replacing with: ${url}`);
    window.history.replaceState(state, title, url);
  },
};

<Router history={customHistory}>
  <App />
</Router>
```

## Context Providers

The Router component provides several React contexts that can be accessed by child components:

- **PathnameContext**: Current pathname (e.g., "/users/123")
- **SearchParamsContext**: Current search parameters as an `ImmutableSearchParams` instance
- **HashContext**: Current hash fragment (e.g., "#section")
- **RouterContext**: Navigation methods (`push`, `replace`)
- **RouteContext**: Initial route context with path "/" and empty params

## Pathname Handling

The Router automatically removes trailing slashes from pathnames to normalize URLs:

- `/users/` becomes `/users`
- `/` remains `/` (root path)

## Navigation Updates

When using the default `window.location` and `window.history`:

- Navigation methods (`push`, `replace`) update the URL and internal state
- State changes trigger re-renders of components using router hooks

When using custom `location` prop:

- Navigation methods still call the history implementation
- Internal state remains static (uses the provided location)
- Useful for controlled routing scenarios

## Examples

### Basic Setup

```tsx
import { Router, Route, Link } from "@farbenmeer/router";

function App() {
  return (
    <Router>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/users">Users</Link>
      </nav>

      <main>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/about">
          <AboutPage />
        </Route>
        <Route path="/users">
          <UsersPage />
        </Route>
      </main>
    </Router>
  );
}
```


### Server-Side Rendering

Don't do that, this is meant for client side rendering only.


## Best Practices

1. **Single Router**: Typically, use one Router component at the root of your application
2. **Testing**: Use the `location` prop for predictable test environments
3. **SSR**: Always provide a `location` prop when rendering on the server
4. **Custom History**: Use custom history for analytics, logging, or special navigation requirements

## Related Components

- [Route](./Route.md) - Define route matching and rendering
- [Link](./Link.md) - Navigate between routes
- [useRouter](./useRouter.md) - Access navigation methods
- [usePathname](./usePathname.md) - Access current pathname
