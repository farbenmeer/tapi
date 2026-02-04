---
title: index.html
description: Your client-side entry point.
---

## index.html

The index.html file is your client-side entry point. It is responsible for rendering your application's UI and handling user interactions.

Bunny essentially just calls [vite](https://vitejs.dev/) to bundle `src/index.html` into your client side application. Therefore `index.html` needs to include the script tag importing the `index.tsx` script which in turn calls [startBunnyClient](/bunny/reference/start-bunny-client) to launch the react application.
