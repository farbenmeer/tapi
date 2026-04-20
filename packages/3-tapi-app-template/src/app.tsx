import { useLacy } from "@farbenmeer/react-tapi";
import { client } from "./client";

export function App() {
  const hello = useLacy(client.hello.get());

  return (
    <main>
      <h1>TApi App</h1>
      <p>{hello.message.$}</p>
    </main>
  );
}
