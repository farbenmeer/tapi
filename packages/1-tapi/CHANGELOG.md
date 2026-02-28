# @farbenmeer/tapi

## 0.9.0

### Minor Changes

- a5228c8: do not pre-parse form data

### Patch Changes

- 4786307: add toPrimitive handler as react seems to call that
- 7720a49: fix: actually return auth data from req.auth()

## 0.8.0

### Minor Changes

- c79808c: Service Worker caching
- 92afc95: distributed caching and invalidation

## 0.7.0

### Minor Changes

- 29cdbe7: patch, put, delete methods

### Patch Changes

- 9e51fd3: add explicit void response feature to TResponse api
- a2c3e5e: remove entries from cache that have no active subscription

## 0.6.1

### Patch Changes

- af307a9: memoize the full observablePromise instead of just the dataPromise

## 0.6.0

### Minor Changes

- 3183448: data is the first parameter to post requests

## 0.5.0

### Minor Changes

- b4f73d8: basic error handling

### Patch Changes

- 03c9103: export HttpError from client package

## 0.4.0

### Minor Changes

- 7f687af: formData parsing will no longer transform fields ending with brackets to an array automatically

### Patch Changes

- 7f687af: fix formData style post method calls

## 0.3.2

### Patch Changes

- f3153f2: unnamed wilcard parameters are not required params
- 9907a33: req.auth is a function and NonNullable

## 0.3.1

### Patch Changes

- 51a563d: await handler execution to handle errors

## 0.3.0

### Minor Changes

- 980801f: switch path syntax from brackets to colon-notation

## 0.2.0

### Minor Changes

- bb41e24: move to pnpm

## 0.1.10

### Patch Changes

- 8a287b3: Add generateOpenAPISchema method to TAPI and serve it as /openapi.json from bunny
- c696188: fix GetRoute type

## 0.1.9

### Patch Changes

- 8620659: split package into separate server and client exports

## 0.1.8

### Patch Changes

- b86ac32: authorization

## 0.1.7

### Patch Changes

- reintroduce cache

## 0.1.6

### Patch Changes

- 348d6e9: remove cache implementation and add react-tapi package

## 0.1.5

### Patch Changes

- 075598f: subsriptions
- 075598f: remove react query client
- 1c38b88: react-query client and tag-based caching

## 0.1.4

### Patch Changes

- d812323: export route types
- b7c534c: cache responses on client

## 0.1.3

### Patch Changes

- 0e3587a: assign fetch to variable to avoid global keyword

## 0.1.2

### Patch Changes

- 7ced7c1: export internal functions for handling single request

## 0.1.1

### Patch Changes

- 6309d9a: allow passing numbers as parameters for dynamic routes
- 6309d9a: pass zod schema for url parameters so they can be coerced on the fly
- 2de24ac: uppercase method names
