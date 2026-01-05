import { vi } from "vitest";

export function mockHistory(pathname = "/") {
  const location = new URL(pathname, "http://localhost:3000");

  return {
    location,
    history: {
      pushState: vi.fn((_state: any, _unused: string, url: string) => {
        location.href = new URL(url, location.href).href;
      }),
      replaceState: vi.fn((_state: any, _unused: string, url: string) => {
        location.href = new URL(url, location.href).href;
      }),
    },
  };
}
