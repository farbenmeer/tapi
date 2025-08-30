import { createContext, use, useMemo, type ReactNode } from "react";

let session: Promise<any> | null = null;

async function fetchSession() {
  const response = await fetch("/api/auth/session");
  if (response.status === 401) return null;
  if (!response.ok)
    throw new Error(`Failed to fetch session: ${response.statusText}`);
  const data = await response.json();
  return data;
}

function getSession() {
  if (!session) session = fetchSession();
  return session;
}

const SessionContext = createContext<any>(null);

export function Auth({
  children,
  signIn,
}: {
  children: ReactNode;
  signIn: ReactNode;
}) {
  const session = use(getSession());

  if (!session) {
    return <>{signIn}</>;
  }

  return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession<Session>(): Session {
  const session = use(SessionContext);
  if (!session)
    throw new Error("useSession must be used within the Auth component");
  return session;
}
