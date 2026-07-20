import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { cpSync } from 'node:fs';

// Shoelace's default icon library fetches SVGs at runtime. Copy them out of
// node_modules so they ship with the site; src/misc/shoelace.ts points the
// base path at /shoelace. static/shoelace is gitignored.
const copyShoelaceIcons = {
	name: 'copy-shoelace-icons',
	buildStart() {
		cpSync(
			path.resolve(__dirname, 'node_modules/@shoelace-style/shoelace/dist/assets/icons'),
			path.resolve(__dirname, 'static/shoelace/assets/icons'),
			{ recursive: true }
		);
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [copyShoelaceIcons, sveltekit()],
	resolve: {
		alias: {
			src: path.resolve(__dirname, './src')
		}
	},
	server: {
		allowedHosts: ['app.log.ddev.site']
	}
};

export default config;
