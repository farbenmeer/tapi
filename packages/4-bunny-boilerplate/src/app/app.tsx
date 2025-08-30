import { useQuery } from "@farbenmeer/bunny";
import { client } from "lib/client";
import { Suspense } from "react";
import logo from "logo.png";

export function App() {
  const hello = useQuery(client.hello.get());

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Bunny!</h1>

      <img src={logo} alt="Logo" className="w-48 h-48 mb-8" />

      <Suspense fallback={<div>Loading...</div>}>
        <div>{hello.then((data) => data.message)}</div>
      </Suspense>
    </div>
  );
}
