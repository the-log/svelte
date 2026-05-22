import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
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
