import type { UserConfig } from "vite";

export interface ServerConfig {
  trustForwardedHeader?: boolean;
  trustHostHeader?: boolean;
  host?: string;
  protocol?: string;
  define?: Record<string, string>;
}

export interface ClientConfig {
  define?: Record<string, string>;
}

export interface WorkerConfig {
  define?: Record<string, string>;
}

export interface BunnyConfig {
  vite?: UserConfig;
  server?: ServerConfig;
  client?: ClientConfig;
  worker?: WorkerConfig;
}
