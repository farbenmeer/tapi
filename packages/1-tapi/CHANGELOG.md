# @farbenmeer/tapi

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
