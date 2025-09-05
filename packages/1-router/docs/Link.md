# Link

The `Link` component provides declarative navigation between routes. It renders as an anchor element but intercepts clicks to perform client-side navigation.

## Usage

```tsx
import { Link } from "@farbenmeer/router";

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/users/123">User Profile</Link>
    </nav>
  );
}
```

## Props

### `href` (required)

- **Type**: `string`
- **Description**: The target URL for navigation. Supports absolute paths, relative paths, query parameters, and external URLs.

```tsx
<Link href="/about">About</Link>                    // Absolute path
<Link href="settings">Settings</Link>               // Relative path
<Link href="?search=query">Search</Link>            // Query parameters only
<Link href="https://example.com">External</Link>    // External URL
```

### `replace` (optional)

- **Type**: `boolean`
- **Description**: Use `history.replaceState()` instead of `history.pushState()` for navigation
- **Default**: `false`

```tsx
<Link href="/login" replace>
  Login
</Link>
```

### `onClick` (optional)

- **Type**: `(event: React.MouseEvent<HTMLAnchorElement>) => void`
- **Description**: Custom click handler called before navigation

```tsx
<Link
  href="/analytics"
  onClick={(e) => {
    trackEvent('navigation', 'analytics-page');
  }}
>
  Analytics
</Link>
```

### HTML Anchor Props

All standard HTML anchor element props are supported and passed through:

```tsx
<Link
  href="/profile"
  className="nav-link"
  id="profile-link"
  target="_blank"      // Note: client-side navigation will be skipped for external targets
  rel="noopener"
  data-testid="profile"
>
  Profile
</Link>
```

## Href Resolution

The Link component intelligently resolves href values based on the current route context:

### Absolute Paths

Absolute paths (starting with `/`) navigate to the exact path regardless of current location:

```tsx
<Link href="/users">Users</Link>           // Always goes to /users
<Link href="/admin/dashboard">Admin</Link>  // Always goes to /admin/dashboard
```

### Relative Paths

Relative paths are resolved based on the current route context:

```tsx
// Current route: /users/123
<Link href="edit">Edit</Link>              // Navigates to /users/123/edit
<Link href="posts">Posts</Link>            // Navigates to /users/123/posts

// In nested routes
<Route path="/users/[id]">
  <Route path="profile">
    {/* Current context: /users/123/profile */}
    <Link href="edit">Edit Profile</Link>   // Navigates to /users/123/profile/edit
  </Route>
</Route>
```

### Query Parameters Only

Href starting with `?` appends query parameters to the current pathname:

```tsx
// Current path: /search
<Link href="?q=react">Search React</Link>  // Navigates to /search?q=react
<Link href="?sort=name&order=asc">Sort</Link> // Navigates to /search?sort=name&order=asc
```

### External URLs

The link component does not handle external URLs. Use the `<a>` tag for external links:
```tsx
<a href="https://farbenmeer.de/en" target="_blank" />
```


## Navigation Behavior

### Client-Side Navigation
The Link component handles client-side navigation for internal links:

1. Prevents the default browser navigation (`event.preventDefault()`)
2. Calls the custom `onClick` handler (if provided)
3. Uses the router's `push` or `replace` method for navigation
4. Updates the URL and triggers re-renders


### Navigation Methods

```tsx
// Push navigation (default) - adds to history stack
<Link href="/page">Go to Page</Link>

// Replace navigation - replaces current history entry
<Link href="/page" replace>Replace Current Page</Link>
```

## Examples

### Basic Navigation

```tsx
function Header() {
  return (
    <header>
      <Link href="/">
        <img src="/logo.png" alt="Home" />
      </Link>

      <nav>
        <Link href="/products">Products</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
```

### Dynamic Links

```tsx
function UserCard({ userId, username }) {
  return (
    <div className="user-card">
      <Link href={`/users/${userId}`}>
        <h3>{username}</h3>
      </Link>
      <Link href={`/users/${userId}/posts`}>
        View Posts
      </Link>
    </div>
  );
}
```

### Nested Route Navigation

```tsx
<Route path="/dashboard">
  <nav>
    <Link href="">Overview</Link>           {/* /dashboard */}
    <Link href="analytics">Analytics</Link>  {/* /dashboard/analytics */}
    <Link href="settings">Settings</Link>    {/* /dashboard/settings */}
  </nav>

  <Route path="users/[id]">
    <nav>
      <Link href="">Profile</Link>           {/* /dashboard/users/123 */}
      <Link href="edit">Edit</Link>          {/* /dashboard/users/123/edit */}
      <Link href="/dashboard">Back to Dashboard</Link> {/* Absolute path */}
    </nav>
  </Route>
</Route>
```

### Search and Filtering

```tsx
function ProductFilters({ currentCategory }) {
  return (
    <div>
      <Link href="?category=electronics">Electronics</Link>
      <Link href="?category=clothing">Clothing</Link>
      <Link href="?category=books">Books</Link>

      {currentCategory && (
        <Link href={`?category=${currentCategory}&sort=price`}>
          Sort by Price
        </Link>
      )}
    </div>
  );
}
```

### Custom Click Handling

```tsx
function AnalyticsLink({ href, eventName, children }) {
  return (
    <Link
      href={href}
      onClick={() => {
        // Track navigation event
        analytics.track('Navigation', {
          event: eventName,
          destination: href
        });
      }}
    >
      {children}
    </Link>
  );
}
```

### Conditional Navigation

```tsx
function ConditionalLink({ href, condition, children, ...props }) {
  if (!condition) {
    return <span {...props}>{children}</span>;
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

// Usage
<ConditionalLink
  href="/admin"
  condition={user.isAdmin}
  className="nav-item"
>
  Admin Panel
</ConditionalLink>
```

### External Link Handling

```tsx
function SmartLink({ href, children, ...props }) {
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
        <ExternalLinkIcon />
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
```

## Styling

Since Link renders as a standard anchor element, it can be styled with CSS:

```css
/* Style all links */
a {
  color: #007bff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Style specific link classes */
.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.nav-link:hover {
  background-color: #f8f9fa;
}
```

```tsx
<Link href="/profile" className="nav-link">
  Profile
</Link>
```


### Active Link Styling

```tsx
function NavLink({ href, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={isActive ? 'nav-link active' : 'nav-link'}
    >
      {children}
    </Link>
  );
}
```

## Related Components

- [Router](./Router.md) - Root router component
- [Route](./Route.md) - Define route matching
- [useRouter](./useRouter.md) - Programmatic navigation
- [usePathname](./usePathname.md) - Access current pathname
