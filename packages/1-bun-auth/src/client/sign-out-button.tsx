import type { ButtonHTMLAttributes } from "react";
import { signOut } from ".";

export function SignOutButton({
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={async (event) => {
        await onClick?.(event);
        if (event.defaultPrevented) return;
        signOut();
      }}
      {...props}
    />
  );
}
