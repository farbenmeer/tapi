# @farbenmeer/bunny

This is a web framework based on [Bun](https://bun.sh/) and [Tapi](https://www.npmjs.com/package/@farbenmeer/tapi).

## Start a project

To scaffold a new project run:
```bash
bunx @farbenmeer/bunny init
```

Then run `bun run migrate` to create the database schema. Bunny uses sqlite as the default database.

## Other commands
* `bun run dev` to start the development server
* `bun run build` to build the project for production
* `bun run start` to start the production server
* `bun run generate` to generate a migration file based on the drizzle schema in `src/lib/schema.ts`
* `bun run migrate` to apply migrations to the database

## Project Structure

The main entry points to the project are
* `src/index.html` for the client side application. Set up static tags for the favicon and the site title and optionally add some loading UI while the react bundle is being loaded.
* `src/index.tsx` as the react-entrypoint. This sets up the react application and renders it into the DOM. If you add a loading UI to index.html this is the place to remove it before rendering the react application. It imports the `App` component that contains the main frontend logic.
* `src/main.css` for global styles (mainly tailwindcss-setup)
* `src/api.ts` for the API entrypoint (using Tapi's `defineApi`). See [Tapi's documentation](https://www.npmjs.com/package/@farbenmeer/tapi) for more information.
* `src/auth.ts` for defining authentication providers using [bun-auth](https://www.npmjs.com/package/@farbenmeer/bun-auth)
