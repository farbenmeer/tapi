import { defineConfig } from "@farbenmeer/bunny";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: ["localhost", "127.0.0.1", "host.containers.internal"],
    },
  },
});
