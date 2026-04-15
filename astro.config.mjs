// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [
		starlight({
			title: 'AI-Ready Astro Docs Template',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/your-org/ai-ready-astro-docs-template' }],
			sidebar: [
				{
					label: 'Underwriting',
					items: [
						{ label: 'Policy Cancellation', slug: 'underwriting-policy-cancellation' },
					],
				},
				{
					label: 'Engineering',
					items: [{ label: 'Policy Lifecycle Service', slug: 'engineering-policy-lifecycle-service' }],
				},
				{
					label: 'Portal',
					items: [{ label: 'Quoting Flow', slug: 'portal-quoting-flow' }],
				},
			],
		}),
	],
});
