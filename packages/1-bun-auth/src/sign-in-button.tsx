import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: string;
}

export function SignInButton({ provider, onClick, ...props }: Props) {
  return (
    <button
      onClick={async (event) => {
        await onClick?.(event);
        if (event.defaultPrevented) return;
        const res = await fetch(`/api/auth/${provider}/url`);
        const { authorizationUrl } = await res.json();
        window.location.href = authorizationUrl;
      }}
      {...props}
    />
  );
}
