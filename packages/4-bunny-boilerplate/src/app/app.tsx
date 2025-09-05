import {
  useQuery,
  Auth,
  SignInButton,
  SignOutButton,
} from "@farbenmeer/bunny/client";
import { client } from "lib/client";
import logo from "logo.png";
import { Suspense } from "react";

export function App() {
  const hello = useQuery(client.hello.get());

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to Bunny!</h1>

      <img src={logo} alt="Logo" className="w-48 h-48 mb-8" />

      <Suspense fallback={<div>Loading...</div>}>
        <div>{hello.then((data) => data.message)}</div>
      </Suspense>

      <div className="mt-8">
        <Auth
          signIn={
            <SignInButton className="border rounded-md p-2" provider="mock">
              Sign In
            </SignInButton>
          }
        >
          <p className="mb-2">Signed in</p>
          <SignOutButton className="border rounded-md p-2">
            Sign Out
          </SignOutButton>
        </Auth>
      </div>
    </div>
  );
}
