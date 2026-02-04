# Tailwind CSS Setup for Bunny

To setup [tailwindcss](https://tailwindcss.com/) with bunny:

* Add `@tailwindcss/vite` as a dev dependency

```bash
pnpm add -D @tailwindcss/vite
```

* Create or update `bunny.config.ts`, add the tailwindcss plugin to the vite config options:

```typescript
// bunny.config.ts
import { defineConfig } from '@farbenmeer/bunny';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

* Import tailwindcss in your main css file:
```css
/* src/main.css */
@import "tailwindcss";
```
