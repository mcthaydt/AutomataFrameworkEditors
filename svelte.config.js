// Svelte reads TypeScript in <script lang="ts"> through Vite's own preprocessor.
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default { preprocess: vitePreprocess() }
