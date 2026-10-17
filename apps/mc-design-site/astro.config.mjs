// mc-design.b28.dev: static pages (Astro), interactive parts as Svelte islands, served by the Worker in worker/index.js.
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import { boardApi } from "./src/lib/board-api.js";

export default defineConfig({
  site: "https://mc-design.b28.dev",
  integrations: [svelte()],
  trailingSlash: "ignore",
  server: { host: "127.0.0.1", port: 5178 },
  vite: { plugins: [boardApi()], server: { allowedHosts: [".ts.net"] } },
});
