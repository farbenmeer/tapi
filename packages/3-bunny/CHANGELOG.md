# @farbenmeer/bunny

## 0.3.1

### Patch Changes

- 07ba32a: gracefully handle closed stream
- b365ce2: flush headers before sending response body
- 47801fd: return error from error hook

## 0.3.0

### Minor Changes

- b4f73d8: basic error handling

### Patch Changes

- Updated dependencies [b4f73d8]
- Updated dependencies [03c9103]
  - @farbenmeer/tapi@0.5.0
  - @farbenmeer/react-tapi@4.0.0

## 0.2.9

### Patch Changes

- Updated dependencies [7f687af]
- Updated dependencies [7f687af]
  - @farbenmeer/tapi@0.4.0
  - @farbenmeer/react-tapi@3.0.0

## 0.2.8

### Patch Changes

- e91cbcd: request logs
- Updated dependencies [f3153f2]
- Updated dependencies [9907a33]
- Updated dependencies [0d17bce]
- Updated dependencies [afa6f78]
- Updated dependencies [bc09780]
  - @farbenmeer/tapi@0.3.2
  - @farbenmeer/router@0.5.0

## 0.2.7

### Patch Changes

- Updated dependencies [51a563d]
- Updated dependencies [cd64f38]
  - @farbenmeer/tapi@0.3.1
  - @farbenmeer/router@0.4.0

## 0.2.6

### Patch Changes

- 7d10e2f: fix incorrect response object conversion

## 0.2.5

### Patch Changes

- 4652e09: correctly load env file

## 0.2.4

### Patch Changes

- Updated dependencies [980801f]
  - @farbenmeer/router@0.3.0
  - @farbenmeer/tapi@0.3.0
  - @farbenmeer/react-tapi@2.0.0

## 0.2.3

### Patch Changes

- 2792981: resolve config from default export
- bc4244e: fix api import path in start script

## 0.2.2

### Patch Changes

- 2949bad: use dynamic import instead of require in bunny start command
- 9526ca0: fix \_\_dirname and incorrect api import in server.js

## 0.2.1

### Patch Changes

- cb0e855: add config file to pass vite config options

## 0.2.0

### Minor Changes

- bb41e24: move to pnpm

### Patch Changes

- Updated dependencies [bb41e24]
  - @farbenmeer/router@0.2.0
  - @farbenmeer/tapi@0.2.0
  - @farbenmeer/react-tapi@1.0.0

## 0.1.5

### Patch Changes

- 8a287b3: Add generateOpenAPISchema method to TAPI and serve it as /openapi.json from bunny
- Updated dependencies [8a287b3]
- Updated dependencies [c696188]
- Updated dependencies [c343771]
  - @farbenmeer/tapi@0.1.10
  - @farbenmeer/react-tapi@0.1.6

## 0.1.4

### Patch Changes

- 8620659: Bunny re-exports all the internal packages
- Updated dependencies [8620659]
- Updated dependencies [8620659]
  - @farbenmeer/bun-auth@0.1.4
  - @farbenmeer/tapi@0.1.9

## 0.1.3

### Patch Changes

- 13eb226: Include files explicitly in boilerplate repo and run install, generate migrate commands in init script

## 0.1.2

### Patch Changes

- 2578a14: Update Boilerplate with latest bun-auth version
- 3d47664: Initialize git repo and add gitignore file in init command

## 0.1.1

### Patch Changes

- 857aead: Add missing dependency on drizzle-orm
