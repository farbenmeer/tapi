import { useQuery } from "@farbenmeer/bunny/client";
import { client } from "client";
import logo from "logo.png";

export function App() {
  const hello = useQuery(client.hello.get());

  return (
    <div className="app-container">
      <h1 className="app-title">Welcome to Bunny!</h1>

      <img src={logo} alt="Logo" className="app-logo" />

      <div className="app-message">{hello.message}</div>
    </div>
  );
}
