import { vi } from "vitest";

export function mockHistory(pathname = "/") {
  const location = new URL(pathname, "http://localhost:3000");
  const stack: string[] = [location.href];

  return {
    location,
    history: {
      pushState: vi.fn((_state: any, _unused: string, url: string) => {
        location.href = new URL(url, location.href).href;
        stack.push(location.href);
      }),
      replaceState: vi.fn((_state: any, _unused: string, url: string) => {
        location.href = new URL(url, location.href).href;
        stack[stack.length - 1] = location.href;
      }),
    },
    back() {
      if (stack.length > 1) {
        stack.pop();
        location.href = stack[stack.length - 1];
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
  };
}
