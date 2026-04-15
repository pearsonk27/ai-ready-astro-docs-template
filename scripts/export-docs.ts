import fg from 'fast-glob';
import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';

type ExportedSection = {
	heading: string;
	content: string;
};

type ExportedDoc = {
	id: string;
	title: string;
	sections: ExportedSection[];
	metadata: Record<string, unknown>;
	source_path: string;
	raw_content: string;
};

const DOCS_GLOB = 'src/content/docs/**/*.md';
const OUTPUT_PATH = path.join(process.cwd(), 'generated/docs.export.json');

function toPosix(value: string): string {
	return value.split(path.sep).join('/');
}

function extractSections(content: string): ExportedSection[] {
	const lines = content.split(/\r?\n/);
	const sections: ExportedSection[] = [];
	let currentHeading = 'Document';
	let buffer: string[] = [];

	const flush = (): void => {
		if (buffer.length === 0) return;
		sections.push({ heading: currentHeading, content: buffer.join('\n').trim() });
		buffer = [];
	};

	for (const line of lines) {
		const heading = line.match(/^##\s+(.+)$/);
		if (heading) {
			flush();
			currentHeading = heading[1].trim();
			continue;
		}
		buffer.push(line);
	}

	flush();
	return sections.filter((section) => section.content.length > 0);
}

async function main(): Promise<void> {
	const files = await fg(DOCS_GLOB, { onlyFiles: true });
	const docs: ExportedDoc[] = [];

	for (const file of files) {
		const raw = await fs.readFile(file, 'utf8');
		const parsed = matter(raw);
		const relativePath = toPosix(path.relative(process.cwd(), file));
		const docId = toPosix(path.relative(path.join(process.cwd(), 'src/content/docs'), file)).replace(/\.md$/, '');

		docs.push({
			id: docId,
			title: String(parsed.data.title ?? ''),
			sections: extractSections(parsed.content),
			metadata: parsed.data as Record<string, unknown>,
			source_path: relativePath,
			raw_content: parsed.content,
		});
	}

	await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await fs.writeFile(OUTPUT_PATH, JSON.stringify(docs, null, 2), 'utf8');
	console.log(`Exported ${docs.length} docs to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

void main();
