import fs from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const DOCS_DIR = path.join(process.cwd(), 'src/content/docs');
const DOMAIN_VALUES = new Set(['underwriting', 'engineering', 'portal']);

type CliOptions = {
	title?: string;
	domain?: string;
	tags?: string;
};

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

function parseTags(rawTags: string): string[] {
	if (!rawTags.trim()) return [];
	return rawTags
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function parseCliOptions(argv: string[]): CliOptions {
	const options: CliOptions = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith('--')) continue;
		const [key, value] = arg.split('=');
		const nextValue = value ?? argv[i + 1];

		switch (key) {
			case '--title':
				options.title = nextValue;
				break;
			case '--domain':
				options.domain = nextValue;
				break;
			case '--tags':
				options.tags = nextValue;
				break;
			default:
				break;
		}

		if (!value && argv[i + 1] && !argv[i + 1].startsWith('--')) {
			i += 1;
		}
	}
	return options;
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

function renderTags(tags: string[]): string {
	if (tags.length === 0) return '[]';
	return `\n${tags.map((tag) => `  - "${tag}"`).join('\n')}`;
}

async function main(): Promise<void> {
	const rl = createInterface({ input, output });
	const cliOptions = parseCliOptions(process.argv.slice(2));

	try {
		const title = (cliOptions.title ?? (await rl.question('Title: '))).trim();
		if (!title) {
			throw new Error('Title is required.');
		}

		const domainInput = (cliOptions.domain ?? (await rl.question('Domain (underwriting|engineering|portal): ')))
			.trim()
			.toLowerCase();
		if (!DOMAIN_VALUES.has(domainInput)) {
			throw new Error('Domain must be one of underwriting, engineering, portal.');
		}

		const tagsInput = cliOptions.tags ?? (await rl.question('Tags (comma-separated): '));
		const tags = parseTags(tagsInput);
		const slug = slugify(title);
		if (!slug) {
			throw new Error('Could not derive a valid filename from title.');
		}

		await fs.mkdir(DOCS_DIR, { recursive: true });
		const filePath = path.join(DOCS_DIR, `${slug}.md`);

		if (await fileExists(filePath)) {
			throw new Error(`File already exists: ${filePath}`);
		}

		const content = `---
title: "${title}"
domain: "${domainInput}"
tags:${renderTags(tags)}
last_updated: "${todayIsoDate()}"
---

Add an overview paragraph that describes this document.

## Rules

## Examples
`;

		await fs.writeFile(filePath, content, 'utf8');
		console.log(`Created ${path.relative(process.cwd(), filePath)}`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : 'Failed to create document.');
		process.exitCode = 1;
	} finally {
		rl.close();
	}
}

void main();
