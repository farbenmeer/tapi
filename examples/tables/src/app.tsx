import { useQuery } from "@toapi/react";
import { client } from "./client";

export function App() {
  console.log("render app");
  const { message } = useQuery(client.greet.get({ who: "world" }));
  return <div>{message}</div>;
}
