# @farbenmeer/react-tapi

React-Binding for [TAPI](https://www.npmjs.com/package/@farbenmeer/tapi)

## Installation
```bash
npm install @farbenmeer/react-tapi
yarn add @farbenmeer/react-tapi
pnpm add @farbenmeer/react-tapi
bun add @farbenmeer/react-tapi
```

## Usage
```tsx
import { useQuery } from '@farbenmeer/react-tapi';
import { client } from "/path/to/tapi-client";
import { use } from 'react';

function Page() {
  const booksPromise = useQuery(client.books.get())
  const books = use(booksPromise)

  return (
    <div>
      {books.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## What does this do?
It subscribes TApi's internal PubSub system to get updates on the data when it is invalidated through TApi's tag-based cache invalication mechanism or manually using the revalidate methods of the TApi client, e.G. `client.books.revalidate()`.

Note that `useQuery` actaully returns a `Promise` which can be passed to client components for granular control of loading states using `Suspense`-Boundaries.
