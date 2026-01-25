---
title: useSearchParams
---


The `useSearchParams` hook provides access to the current URL search parameters (query string). It returns an `ImmutableSearchParams` instance that extends `URLSearchParams` with immutable methods.

## Usage

It's really just URLSearchParams but with immutable methods.

To change one search parameter while preserving the rest use:

```tsx
const searchParams = useSearchParams();

return <Link href={"?" + searchParams.set('query', 'whatever')} />
```

or (to delete a parameter)

```tsx
const searchParams = useSearchParams();

return <Link href={"?" + searchParams.delete('query')} />
```

or (for array-parameters)

```tsx
const searchParams = useSearchParams();

return <Link href={"?" + searchParams.append('options[]', 'value')} />
```

That's it.
