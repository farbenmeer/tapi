# usePathname

The `usePathname` hook provides access to the current pathname of the URL. It returns a string representing the current path without query parameters or hash fragments.

## Usage

```tsx
import { usePathname } from "@farbenmeer/router";

function Navigation() {
  const pathname = usePathname();
  
  return (
    <nav>
      <a 
        href="/" 
        className={pathname === "/" ? "active" : ""}
      >
        Home
      </a>
      <a 
        href="/about" 
        className={pathname === "/about" ? "active" : ""}
      >
        About
      </a>
    </nav>
  );
}
```

## Return Value

- **Type**: `string`
- **Description**: The current pathname without query parameters or hash fragment
- **Examples**:
  - `/` for the root path
  - `/users` for a users page  
  - `/users/123` for a specific user
  - `/products/category/electronics` for nested paths

## Pathname Normalization

The pathname is normalized by the Router component:
- Trailing slashes are removed: `/users/` becomes `/users`
- Root path remains `/`
- Empty pathnames become `""`

## Examples

### Active Navigation Links

```tsx
function NavItem({ href, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      {children}
    </Link>
  );
}

function Navigation() {
  return (
    <nav>
      <NavItem href="/">Home</NavItem>
      <NavItem href="/products">Products</NavItem>
      <NavItem href="/about">About</NavItem>
      <NavItem href="/contact">Contact</NavItem>
    </nav>
  );
}
```

### Conditional Rendering Based on Path

```tsx
function Layout({ children }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");
  const isPublicPage = ["/", "/about", "/contact"].includes(pathname);
  
  return (
    <div className="layout">
      {!isAdminPage && <Header />}
      
      <main className={isAdminPage ? "admin-layout" : "public-layout"}>
        {children}
      </main>
      
      {isPublicPage && <Footer />}
    </div>
  );
}
```

### Breadcrumb Generation

```tsx
function Breadcrumbs() {
  const pathname = usePathname();
  
  const pathSegments = pathname
    .split("/")
    .filter(Boolean); // Remove empty segments
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return { href, label };
  });
  
  return (
    <nav aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.href}>
          <span> / </span>
          {index === breadcrumbs.length - 1 ? (
            <span aria-current="page">{crumb.label}</span>
          ) : (
            <Link href={crumb.href}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
```

### Page-Specific Styles

```tsx
function App() {
  const pathname = usePathname();
  
  // Generate CSS classes based on current path
  const pageClasses = [
    "app",
    pathname === "/" && "home-page",
    pathname.startsWith("/admin") && "admin-page",
    pathname.startsWith("/user") && "user-page",
  ].filter(Boolean).join(" ");
  
  return (
    <div className={pageClasses}>
      <Router>
        {/* routes */}
      </Router>
    </div>
  );
}
```

### Analytics and Tracking

```tsx
function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Track page views
    analytics.track("Page View", {
      path: pathname,
      timestamp: new Date().toISOString(),
    });
  }, [pathname]);
  
  useEffect(() => {
    // Update page title based on path
    const titles = {
      "/": "Home",
      "/about": "About Us", 
      "/contact": "Contact",
      "/products": "Products",
    };
    
    document.title = titles[pathname] || "Page Not Found";
  }, [pathname]);
  
  return <>{children}</>;
}
```

### Route Guards

```tsx
function RouteGuard({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isProtectedRoute = pathname.startsWith("/dashboard") || 
                          pathname.startsWith("/profile");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isProtectedRoute && !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (isAuthRoute && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}
```

### Dynamic Navigation Menus

```tsx
function DynamicMenu() {
  const pathname = usePathname();
  
  const menuItems = useMemo(() => {
    const baseItems = [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
    ];
    
    // Add admin items for admin pages
    if (pathname.startsWith("/admin")) {
      return [
        ...baseItems,
        { href: "/admin", label: "Admin Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/settings", label: "Settings" },
      ];
    }
    
    // Add user items for user pages
    if (pathname.startsWith("/user")) {
      return [
        ...baseItems,
        { href: "/user/profile", label: "Profile" },
        { href: "/user/orders", label: "Orders" },
      ];
    }
    
    return baseItems;
  }, [pathname]);
  
  return (
    <nav>
      {menuItems.map(item => (
        <Link 
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "active" : ""}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### Path-Based Data Fetching

```tsx
function DataProvider({ children }) {
  const pathname = usePathname();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Different API endpoints based on current path
        let endpoint;
        if (pathname === "/") {
          endpoint = "/api/home-data";
        } else if (pathname.startsWith("/products")) {
          endpoint = "/api/products";
        } else if (pathname.startsWith("/users")) {
          endpoint = "/api/users";
        }
        
        if (endpoint) {
          const response = await fetch(endpoint);
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pathname]);
  
  return (
    <DataContext.Provider value={{ data, loading }}>
      {children}
    </DataContext.Provider>
  );
}
```

## Pattern Matching

### Exact Match

```tsx
const pathname = usePathname();
const isExactMatch = pathname === "/specific/path";
```

### Prefix Match

```tsx
const pathname = usePathname();
const isAdminArea = pathname.startsWith("/admin");
const isUserArea = pathname.startsWith("/user");
```

### Pattern Matching with Regex

```tsx
const pathname = usePathname();

// Match user profile paths like /users/123
const userProfileMatch = pathname.match(/^\/users\/\d+$/);
const isUserProfile = !!userProfileMatch;

// Match product category paths like /products/electronics/laptops
const categoryMatch = pathname.match(/^\/products\/([^\/]+)\/([^\/]+)$/);
const [, category, subcategory] = categoryMatch || [];
```

### Path Segments

```tsx
function usePathSegments() {
  const pathname = usePathname();
  
  return useMemo(() => {
    return pathname.split("/").filter(Boolean);
  }, [pathname]);
}

// Usage
function Component() {
  const segments = usePathSegments();
  // For "/users/123/profile" returns ["users", "123", "profile"]
  
  const isUserPage = segments[0] === "users";
  const userId = segments[1];
  const section = segments[2];
}
```

## Best Practices

1. **Use for UI state**: Perfect for conditional rendering and styling based on current path
2. **Memoize expensive computations**: Use `useMemo` for complex path-based calculations
3. **Combine with other hooks**: Often used together with `useParams` and `useSearchParams`
4. **Avoid side effects**: Don't use pathname changes to trigger navigation (use `useRouter` instead)
5. **Handle edge cases**: Account for empty pathnames and trailing slashes

## Common Anti-Patterns

### ❌ Don't use for navigation

```tsx
// Wrong - don't navigate based on pathname changes
useEffect(() => {
  if (pathname === "/old-path") {
    router.push("/new-path");
  }
}, [pathname]);
```

### ❌ Don't ignore normalization

```tsx
// Wrong - might not match due to trailing slash
const isActive = pathname === "/users/";

// Correct - router normalizes trailing slashes
const isActive = pathname === "/users";
```

## Related Hooks

- [useRouter](./useRouter.md) - Programmatic navigation
- [useParams](./useParams.md) - Access route parameters
- [useSearchParams](./useSearchParams.md) - Access search parameters
- [useHash](./useHash.md) - Access URL hash fragment