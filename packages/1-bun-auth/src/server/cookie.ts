interface Options {
  secure: boolean;
  maxAge?: number;
  path?: string;
}

export function secureCookie(
  name: string,
  value: string | undefined | null,
  options: Options
) {
  const parts = [
    `${name}=${value ?? ""}`,
    `max-age=${options.maxAge ?? 3600}`,
    `HttpOnly`,
    `Path=${options.path ?? "/api/auth"}`,
  ];
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}
