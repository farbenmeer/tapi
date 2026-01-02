# useParams

The `useParams` hook provides access to the current route parameters extracted from the URL path. It returns an object containing all captured parameters from dynamic route segments.

## Usage

```tsx
import { useParams } from "@farbenmeer/router";

function UserProfile() {
  const params = useParams();
  const userId = params.id; // From route like /users/:id

  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {userId}</p>
    </div>
  );
}
```

## Return Value

- **Type**: `Record<string, string | string[]>`
- **Description**: An object where keys are parameter names (from `:paramName` in route paths) and values are the captured URL segments
- **Parameter Values**: Always strings, as they come from URL segments

## Parameter Extraction

### Single Parameters

```tsx
// Route: /users/:id
// URL: /users/123
function UserDetail() {
  const params = useParams();
  console.log(params); // { id: "123" }

  return <div>User {params.id}</div>;
}
```

### Multiple Parameters

```tsx
// Route: /users/:userId/posts/:postId
// URL: /users/123/posts/456
function PostDetail() {
  const params = useParams();
  console.log(params); // { userId: "123", postId: "456" }

  return (
    <div>
      <p>User: {params.userId}</p>
      <p>Post: {params.postId}</p>
    </div>
  );
}
```

### Complex Parameter Names

```tsx
// Route: /api/:version/users/:userId/documents/:documentId
// URL: /api/v1/users/123/documents/doc-456
function APIEndpoint() {
  const params = useParams();
  console.log(params);
  // { version: "v1", userId: "123", documentId: "doc-456" }

  return <div>API v{params.version} - Document {params.documentId}</div>;
}
```

## Nested Route Parameters

In nested routes, child routes inherit parameters from their parent routes:

```tsx
<Route path="/users/:id">
  <Route path="posts">
    <Route path=":postId">
      <PostEditor />
    </Route>
  </Route>
</Route>

function PostEditor() {
  const params = useParams();
  // URL: /users/123/posts/456
  // params = { id: "123", postId: "456" }

  return (
    <div>
      <p>Editing post {params.postId} for user {params.id}</p>
    </div>
  );
}
```

## Typescript

Since the shape of the `params` object is determined by the route path, you can use TypeScript to define the type:

```tsx
interface Params {
  id: string;
  postId: string;
}

function PostDetail() {
  const params = useParams<Params>();
  console.log(params); // { id: "123", postId: "456" }

  return (
    <div>
      <p>User: {params.id}</p>
      <p>Post: {params.postId}</p>
    </div>
  );
}
```
