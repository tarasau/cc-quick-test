import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss() as any],
    envDir: process.cwd(),
    envPrefix: ['VITE_', 'POSTGRES_', 'PGADMIN_', 'DATABASE_', 'NODE_'],
  }
});
