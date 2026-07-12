# useRouter

The `useRouter` hook provides access to navigation methods for programmatic routing. It returns an object with `push` and `replace` methods to navigate between routes.

## Usage

```tsx
import { useRouter } from "@farbenmeer/router";

function LoginForm() {
  const router = useRouter();

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  );
}
```

## Return Value

The hook returns an object with the following methods:

### `push(url: string)`

- **Description**: Navigate to a new route by adding a new entry to the browser's history stack
- **Parameters**:
  - `url` (string): The destination URL (absolute path, relative path, or full URL with query parameters)
- **Returns**: `void`

```tsx
const router = useRouter();

// Navigate to absolute path
router.push("/users");

// Navigate with parameters
router.push("/users/123");

// Navigate with query parameters
router.push("/search?q=react");

// Navigate with hash
router.push("/docs#installation");

// Navigate with everything
router.push("/products?category=electronics&sort=price#top");
```

### `replace(url: string)`

- **Description**: Navigate to a new route by replacing the current entry in the browser's history stack
- **Parameters**:
  - `url` (string): The destination URL (absolute path, relative path, or full URL with query parameters)
- **Returns**: `void`

```tsx
const router = useRouter();

// Replace current history entry
router.replace("/login");

// Useful for redirects where you don't want users to go back
router.replace("/dashboard");
```

## Navigation Methods Comparison

| Method | History Stack | Use Case |
|--------|---------------|----------|
| `push` | Adds new entry | Normal navigation, allows back button |
| `replace` | Replaces current entry | Redirects, login flows, error corrections |
