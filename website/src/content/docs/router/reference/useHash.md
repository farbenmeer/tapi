---
title: useHash
---

The `useHash` hook provides access to the current URL hash fragment (the part after `#`). It returns a string containing the hash value, including the `#` symbol when present.

## Usage

```tsx
import { useHash } from "@farbenmeer/router";

function TableOfContents() {
  const hash = useHash();

  return (
    <nav>
      <a
        href="#introduction"
        className={hash === "#introduction" ? "active" : ""}
      >
        Introduction
      </a>
      <a
        href="#features"
        className={hash === "#features" ? "active" : ""}
      >
        Features
      </a>
    </nav>
  );
}
```
