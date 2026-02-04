---
title: Bundle Splitting
description: How to split your application into multiple bundles.
---

## Bundle Splitting

Bunny is meant to be used for web applications and is designed to be bundled into a single, potentially large, javascript bundle.

This is usually fine as for an application, most users will be recurring users and the large bundle will be cached by the service worker so it will only need to be downloaded once after every new release of your application on each device.

The upside of this is that after the initial download, interaction will be fast and responsive as the client does not have to download another bundle on interaction.

There are, though, some cases where splitting the bundle makes sense, for example when some rarely used part of the application requires some large third-party library.

To split the bundle, just use `React.lazy` with a dynamic import, for example with [@farbenmeer/router](/router):

```jsx
const SuperFancyAnimatedGraph = React.lazy(() => import('./super-fancy-animated-graph'));

<Route path="/super-fancy-animated-graph">
  <SuperFancyAnimatedGraph />
</Route>
```

That's it!
