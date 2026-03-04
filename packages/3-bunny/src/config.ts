import type { UserConfig } from "vite";

export interface ServerConfig {
  trustForwardedHeader?: boolean;
  trustHostHeader?: boolean;
  host?: string;
  protocol?: string;
}

export interface BunnyConfig {
  vite?: UserConfig;
  server?: ServerConfig;
}
