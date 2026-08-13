interface CookieListItem {
  name: string;
  value: string;
  domain: string | null;
  path: string;
  expires: number | null;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  partitioned: boolean;
}

interface CookieStoreGetOptions {
  name: string;
}

interface CookieInit {
  name: string;
  value: string;
  domain?: string | null;
  path?: string;
  expires?: number | null;
  sameSite?: "strict" | "lax" | "none";
  partitioned?: boolean;
}

interface CookieStoreDeleteOptions {
  name: string;
  domain?: string | null;
  path?: string;
  partitioned?: boolean;
}

function parseCookieString(cookieString: string): CookieListItem[] {
  if (!cookieString) return [];
  return cookieString.split(";").reduce<CookieListItem[]>((cookies, part) => {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) return cookies;
    const name = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    if (!name) return cookies;
    cookies.push({
      name,
      value: decodeURIComponent(value),
      domain: null,
      path: "/",
      expires: null,
      secure: false,
      sameSite: "lax",
      partitioned: false,
    });
    return cookies;
  }, []);
}

function serializeSetCookie(cookie: CookieListItem): string {
  let str = `${cookie.name}=${encodeURIComponent(cookie.value)}`;
  if (cookie.domain) str += `; Domain=${cookie.domain}`;
  if (cookie.path) str += `; Path=${cookie.path}`;
  if (cookie.expires !== null) {
    str += `; Expires=${new Date(cookie.expires).toUTCString()}`;
  }
  if (cookie.secure) str += "; Secure";
  if (cookie.sameSite) {
    str += `; SameSite=${
      cookie.sameSite.charAt(0).toUpperCase() + cookie.sameSite.slice(1)
    }`;
  }
  if (cookie.partitioned) str += "; Partitioned";
  return str;
}

export class CookieStore {
  #cookies: CookieListItem[];
  #changed = new Set<string>();
  #deleted = new Set<string>();

  constructor(request: Request) {
    this.#cookies = parseCookieString(request.headers.get("cookie") ?? "");
  }

  async get(
    nameOrOptions?: string | CookieStoreGetOptions
  ): Promise<CookieListItem | undefined> {
    const name =
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions?.name;
    if (name === undefined) return this.#cookies[0];
    return this.#cookies.find((c) => c.name === name);
  }

  async getAll(
    nameOrOptions?: string | CookieStoreGetOptions
  ): Promise<CookieListItem[]> {
    const name =
      typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions?.name;
    if (name === undefined) return [...this.#cookies];
    return this.#cookies.filter((c) => c.name === name);
  }

  async set(nameOrOptions: string | CookieInit, value?: string): Promise<void> {
    const init: CookieInit =
      typeof nameOrOptions === "string"
        ? { name: nameOrOptions, value: value ?? "" }
        : nameOrOptions;

    const existing = this.#cookies.find((c) => c.name === init.name);
    const cookie: CookieListItem = {
      name: init.name,
      value: init.value,
      domain: init.domain ?? existing?.domain ?? null,
      path: init.path ?? existing?.path ?? "/",
      expires: init.expires ?? existing?.expires ?? null,
      secure: existing?.secure ?? false,
      sameSite: init.sameSite ?? existing?.sameSite ?? "lax",
      partitioned: init.partitioned ?? existing?.partitioned ?? false,
    };

    if (existing) {
      const idx = this.#cookies.indexOf(existing);
      this.#cookies[idx] = cookie;
    } else {
      this.#cookies.push(cookie);
    }

    this.#deleted.delete(init.name);
    this.#changed.add(init.name);
  }

  async delete(
    nameOrOptions: string | CookieStoreDeleteOptions
  ): Promise<void> {
    const opts: CookieStoreDeleteOptions =
      typeof nameOrOptions === "string"
        ? { name: nameOrOptions }
        : nameOrOptions;

    const idx = this.#cookies.findIndex((c) => c.name === opts.name);
    if (idx !== -1) {
      this.#cookies.splice(idx, 1);
    }

    this.#changed.delete(opts.name);
    this.#deleted.add(opts.name);
  }

  write(headers: Headers): void {
    for (const name of this.#changed) {
      const cookie = this.#cookies.find((c) => c.name === name);
      if (cookie) {
        headers.append("Set-Cookie", serializeSetCookie(cookie));
      }
    }

    for (const name of this.#deleted) {
      headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Expires=${new Date(0).toUTCString()}`
      );
    }
  }
}
