import { useLacy, useQuery } from "@farbenmeer/bunny/client";
import { client } from "client";
import { Suspense } from "react";

export function App() {
  const env = useQuery(client.env.get());

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Env is</h1>

      <pre>{JSON.stringify(env, null, 2)}</pre>
    </div>
  );
}
