import { useLacy } from "@farbenmeer/bunny/client";
import { client } from "client";
import logo from "logo.png";
import { Suspense } from "react";

export function App() {
  const hello = useLacy(client.hello.get());

  return (
    <div className="app-container">
      <h1 className="app-title">Welcome to Bunny!</h1>

      <img src={logo} alt="Logo" className="app-logo" />

      <Suspense fallback={<div>Loading...</div>}>
        <div className="app-message">{hello.message.$}</div>
      </Suspense>
    </div>
  );
}
