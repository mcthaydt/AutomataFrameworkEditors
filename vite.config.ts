// The page: Svelte 5, built into static files in `dist/`. The API is not built here; Cloudflare builds
// `functions/` itself. `--mode journeys` reads `.env.journeys`, which points the page at the pretend GitHub.
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, type UserConfig } from 'vite'

const config: UserConfig = defineConfig({
  plugins: [svelte()],
  build: { target: 'es2023', sourcemap: true },
})

export default config
