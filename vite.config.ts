import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, defineConfig, searchForWorkspaceRoot } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { llamaCppBuildPlugin } from './scripts/vite-plugin-llama-cpp-build';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080';

	return {
		resolve: {
			alias: {
				'katex-fonts': resolve('node_modules/katex/dist/fonts')
			}
		},

		build: {
			assetsInlineLimit: 32000,
			chunkSizeWarningLimit: 3000,
			minify: true,
		},

		esbuild: {
			lineLimit: 500,
			minifyIdentifiers: false
		},

		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `
						$use-woff2: true;
						$use-woff: false;
						$use-ttf: false;
					`,
					// Silence deprecation warnings from katex dependency (node_modules)
					silenceDeprecations: ['import', 'color-functions', 'global-builtin']
				}
			}
		},

		plugins: [tailwindcss(), sveltekit(), devtoolsJson(), llamaCppBuildPlugin()],

		test: {
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						environment: 'browser',
						browser: {
							enabled: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium' }]
						},
						include: ['tests/client/**/*.svelte.{test,spec}.{js,ts}'],
						setupFiles: ['./vitest-setup-client.ts']
					}
				},

				{
					extends: './vite.config.ts',
					test: {
						name: 'unit',
						environment: 'node',
						include: ['tests/unit/**/*.{test,spec}.{js,ts}']
					}
				},

				{
					extends: './vite.config.ts',
					test: {
						name: 'ui',
						environment: 'browser',
						browser: {
							enabled: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium', headless: true }]
						},
						include: ['tests/stories/**/*.stories.{js,ts,svelte}'],
						setupFiles: ['./.storybook/vitest.setup.ts']
					},
					plugins: [
						storybookTest({
							storybookScript: 'pnpm run storybook --no-open'
						})
					]
				}
			]
		},

		server: {
			proxy: {
				'/v1': apiTarget,
				'/props': apiTarget,
				'/models': apiTarget,
				'/tools': apiTarget,
				'/cors-proxy': apiTarget,
				'/slots': apiTarget
			},
			headers: {
				'Cross-Origin-Embedder-Policy': 'require-corp',
				'Cross-Origin-Opener-Policy': 'same-origin'
			},
			fs: {
				allow: [searchForWorkspaceRoot(process.cwd()), resolve(__dirname, 'tests')]
			}
		}
	};
});