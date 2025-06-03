import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  //@ts-ignore
  start: {
    server: {
      preset: "cloudflare-pages",
      // We will need to enable CF Pages node compatiblity
      // https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/
      rollupConfig: {
        external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"],
      },
    },
  },
  server: {
    preset: "cloudflare-pages",
    rollupConfig: {
      external: ["__STATIC_CONTENT_MANIFEST", "node:async_hooks"],
    },
    experimental: {
      wasm: true
    }
  },
  vite: {
    plugins: [tailwindcss() as any],
    envDir: process.cwd(),
    envPrefix: ['VITE_', 'POSTGRES_', 'PGADMIN_', 'DATABASE_', 'NODE_'],
    define: {
      global: "globalThis",
      __dirname: "undefined",
      __filename: "undefined",
    },
    resolve: {
      alias: {
        "node:crypto": "crypto",
        "node:async_hooks": "unenv/runtime/mock/proxy",
      },
    },
    optimizeDeps: {
      include: ["crypto"],
    },
  }
});
