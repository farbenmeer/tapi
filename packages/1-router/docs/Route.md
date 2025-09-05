# Route

The `Route` component conditionally renders its children based on the current pathname. It supports path parameters, exact matching, and nested routing.

## Usage

```tsx
import { Route } from "@farbenmeer/router";

function App() {
  return (
    <Router>
      <Route path="/users">
        <UsersPage />
      </Route>
      <Route path="/users/[id]">
        <UserDetailPage />
      </Route>
    </Router>
  );
}
```

## Props

### `path` (optional)

- **Type**: `string`
- **Description**: The path pattern to match against the current pathname
- **Default**: `""` (matches any path when used as a nested route)

Path patterns support:
- **Static segments**: `/users`, `/about`
- **Parameters**: `/users/[id]`, `/posts/[slug]`
- **Nested paths**: Resolved relative to parent route context

```tsx
// Static path
<Route path="/about">
  <AboutPage />
</Route>

// Path with parameter
<Route path="/users/[id]">
  <UserPage />
</Route>

// Nested relative path (resolves to parent path + "settings")
<Route path="/users/[id]">
  <Route path="settings">
    <UserSettings />
  </Route>
</Route>
```

### `exact` (optional)

- **Type**: `boolean`
- **Description**: Whether the path must match exactly (no additional segments allowed)
- **Default**: `false`

```tsx
// Matches "/users" and "/users/123" and "/users/123/posts"
<Route path="/users">
  <UsersLayout />
</Route>

// Matches only "/users" exactly
<Route exact path="/users">
  <UsersList />
</Route>
```

### `children` (required)

- **Type**: `ReactNode`
- **Description**: The content to render when the route matches

## Path Matching

### Static Paths

```tsx
<Route path="/about">About Page</Route>           // Matches: /about, /about/
<Route path="/users/create">Create User</Route>   // Matches: /users/create, /users/create/
```

### Path Parameters

Parameters are defined with square brackets and capture URL segments:

```tsx
<Route path="/users/[id]">
  {/* Access via useParams() hook */}
</Route>

<Route path="/posts/[year]/[month]/[slug]">
  {/* Multiple parameters */}
</Route>
```


## Nested Routes

Routes can be nested to create hierarchical routing structures:

```tsx
<Route path="/users">
  <UsersLayout />

  <Route path="[id]">
    <UserProfile />

    <Route path="settings">
      <UserSettings />
    </Route>

    <Route path="posts">
      <UserPosts />
    </Route>
  </Route>
</Route>
```

### Path Resolution

Nested route paths are resolved relative to their parent:

```tsx
<Route path="/api/v1">              {/* Full path: /api/v1 */}
  <Route path="users">              {/* Full path: /api/v1/users */}
    <Route path="[id]">             {/* Full path: /api/v1/users/[id] */}
      <Route path="posts">          {/* Full path: /api/v1/users/[id]/posts */}
```

### Absolute Paths in Nested Routes

Child routes can use absolute paths to ignore parent context:

```tsx
<Route path="/groups/[groupId]">
  <Route path="/groups/admin/settings">             {/* Absolute path - matches only if groupId === "admin" */}
    <LoginPage />
  </Route>
</Route>
```

## Route Context

Each Route component provides context to its children:
- **path**: The full resolved path pattern
- **params**: Object containing captured path parameters

Access this context using the `useParams()` hook:

```tsx
<Route path="/users/[id]/posts/[postId]">
  <PostDetail />
</Route>

function PostDetail() {
  const params = useParams(); // { id: "123", postId: "456" }
  return <div>User {params.id}, Post {params.postId}</div>;
}
```

## Examples

### Basic Routing

```tsx
<Router>
  <Route path="/">
    <HomePage />
  </Route>
  <Route path="/about">
    <AboutPage />
  </Route>
  <Route path="/contact">
    <ContactPage />
  </Route>
</Router>
```

### Parameterized Routes

```tsx
<Router>
  <Route path="/users/[id]">
    <UserProfile />
  </Route>
  <Route path="/posts/[slug]">
    <BlogPost />
  </Route>
  <Route path="/categories/[category]/posts/[id]">
    <CategoryPost />
  </Route>
</Router>
```

### Layout Routes

```tsx
<Router>
  <Route path="/dashboard">
    <DashboardLayout>
      <Route exact path="">
        <DashboardHome />
      </Route>
      <Route path="analytics">
        <Analytics />
      </Route>
      <Route path="settings">
        <Settings />
      </Route>
    </DashboardLayout>
  </Route>
</Router>
```

### Deeply Nested Routes

```tsx
<Router>
  <Route path="/admin">
    <AdminLayout>
      <Route path="users">
        <UsersSection>
          <Route exact path="">
            <UsersList />
          </Route>
          <Route path="[id]">
            <UserDetail>
              <Route exact path="">
                <UserOverview />
              </Route>
              <Route path="edit">
                <EditUser />
              </Route>
              <Route path="permissions">
                <UserPermissions />
              </Route>
            </UserDetail>
          </Route>
        </UsersSection>
      </Route>
    </AdminLayout>
  </Route>
</Router>
```

### Route Without Path

Routes without a path prop match any path within their parent context:

```tsx
<Route path="/users/[id]">
  <UserLayout />

  <Route>
    {/* Always renders when parent matches */}
    <UserNavigation />
  </Route>

  <Route path="profile">
    <UserProfile />
  </Route>
</Route>
```

## Best Practices

1. **Use exact matching** for leaf routes that shouldn't match child paths
2. **Keep route hierarchies shallow** when possible for better performance
3. **Use descriptive parameter names**: `[userId]` instead of `[id]` for clarity
4. **Group related routes** under common parent routes
5. **Use layout routes** for shared UI components

## Common Patterns

### Default/Fallback Routes

```tsx
<Route path="/dashboard">
  <Route exact path="">
    <DashboardHome />
  </Route>
  <Route path="analytics">
    <Analytics />
  </Route>
  {/* This could serve as a fallback for unmatched paths under /dashboard */}
</Route>
```

### Optional Segments

```tsx
// Handle both /posts and /posts/[id]
<Route path="/posts">
  <PostsLayout />
  <Route exact path="">
    <PostsList />
  </Route>
  <Route path="[id]">
    <PostDetail />
  </Route>
</Route>
```

### Multiple Parameter Formats

```tsx
<Route path="/blog/[year]/[month]/[slug]">  {/* /blog/2024/03/my-post */}
<Route path="/users/[userId]">              {/* /users/123 */}
<Route path="/files/[...path]">             {/* Currently not supported - would need custom implementation */}
```

## Related Components

- [Router](./Router.md) - Root router component
- [Link](./Link.md) - Navigate between routes
- [useParams](./useParams.md) - Access route parameters
- [usePathname](./usePathname.md) - Access current pathname
