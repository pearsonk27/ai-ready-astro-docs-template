import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const domainSchema = z.enum(['underwriting', 'engineering', 'portal']);
const isoDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'last_updated must use YYYY-MM-DD format');

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				title: z.string().min(1, 'title is required'),
				domain: domainSchema,
				tags: z.array(z.string()),
				last_updated: isoDateSchema,
			}),
		}),
	}),
};
