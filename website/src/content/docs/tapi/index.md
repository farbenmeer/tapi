---
title: TApi
description: Painless and Safe REST-APIs
---
This library makes it possible to build a Rest API including a fully typed client without a compile step.

## Why?

* Type-Safe Client-SDK without a build step
* Required authorizer-function for each route making nearly impossible to end up with unauthenticated routes
* Automatic Tag-Based Caching
* Automatic Service-Worker Caching so apps built with TApi are available offline by default
* Real REST API with proper Error handling following HTTP conventions
* Built-in validation based on [zod](https://zod.dev/)
* Automatic OpenAPI Documentation (which can be enhanced by adding a few additional properties to zod schemas)
* Automatic reactive updates


## How to use this?
The easiest and recommended way to use TApi is with the [Bunny Framework](/bunny). If you want to try out TApi, just create a new Bunny project and play around with it.

To use TApi with another framework refer to one of our guides:
* [astro](/tapi/guides/astro)
* [nextjs](/tapi/guides/nextjs)
* [hono](/tapi/guides/hono)



## State of this library
Very much alpha. I just came up with this idea.


## Inspiration
Very much [TRPC](https://trpc.io/). It's quite similar but with a REST paradigm so the API is actually usable for other clients.
