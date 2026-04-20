# create-tapi-app

Scaffold a new [TApi](https://www.npmjs.com/package/@farbenmeer/tapi) project on top of [Nitro](https://nitro.build) + [Vite](https://vite.dev) + React.

## Usage

```bash
pnpm create tapi-app my-project
# or
npx create-tapi-app my-project
# or
bunx create-tapi-app my-project
```

Flags:

- `--use <pnpm|npm|yarn|bun>` — pick the package manager (default: auto-detect from `npm_config_user_agent`, falls back to `pnpm`).
- `--no-install` — skip the install step.
- `--no-git` — skip `git init`.

## What you get

A standalone project ready to run:

```bash
cd my-project
pnpm dev      # dev server with HMR
pnpm build    # production build → .output/
pnpm start    # run the production server
```

See the generated `README.md` inside the project for layout details.
