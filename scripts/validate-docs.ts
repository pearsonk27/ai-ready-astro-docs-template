import fg from 'fast-glob';
import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';

type ValidationIssue = {
	file: string;
	message: string;
};

const DOCS_GLOB = 'src/content/docs/**/*.md';
const REQUIRED_SECTIONS = ['rules', 'examples'];
const DISALLOWED_PHRASES = [/\bsee above\b/i, /\bas mentioned earlier\b/i];


function toPosix(filePath: string): string {
	return filePath.split(path.sep).join('/');
}

function collectHeadingNames(markdown: string): Set<string> {
	const headings = new Set<string>();
	const headingMatches = markdown.matchAll(/^##\s+(.+)$/gm);
	for (const match of headingMatches) {
		headings.add(match[1].trim().toLowerCase());
	}
	return headings;
}

function extractOverviewText(markdown: string): string {
	const lines = markdown.split(/\r?\n/);
	const overviewLines: string[] = [];

	for (const line of lines) {
		if (/^##\s+/.test(line)) break;
		overviewLines.push(line);
	}

	return overviewLines.join('\n').trim();
}

function validateRequiredSections(content: string, file: string): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const headings = collectHeadingNames(content);
	const overviewText = extractOverviewText(content);

	if (!overviewText) {
		issues.push({
			file,
			message: 'Missing required overview content before the first ## heading',
		});
	}

	if (headings.has('summary')) {
		issues.push({
			file,
			message: 'Do not use ## Summary. Place overview text directly under frontmatter.',
		});
	}

	issues.push(
		...REQUIRED_SECTIONS.filter((section) => !headings.has(section)).map((missing) => ({
			file,
			message: `Missing required section: ## ${missing[0].toUpperCase()}${missing.slice(1)}`,
		}))
	);

	return issues;
}

function validateDisallowedPhrases(content: string, file: string): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	for (const phrasePattern of DISALLOWED_PHRASES) {
		if (phrasePattern.test(content)) {
			issues.push({
				file,
				message: `Contains disallowed phrase: ${phrasePattern.source.replace(/\\b/g, '')}`,
			});
		}
	}
	return issues;
}

function hasMarkdownImage(line: string): boolean {
	return /!\[[^\]]*\]\([^)]*\)/.test(line);
}

function hasHtmlImage(line: string): boolean {
	return /<img\b[^>]*>/i.test(line);
}

function markdownAltText(line: string): string | null {
	const match = line.match(/!\[([^\]]*)\]\([^)]*\)/);
	if (!match) return null;
	return match[1]?.trim() ?? '';
}

function htmlAltText(line: string): string | null {
	const tagMatch = line.match(/<img\b[^>]*>/i);
	if (!tagMatch) return null;
	const altMatch = tagMatch[0].match(/\balt\s*=\s*(['"])(.*?)\1/i);
	if (!altMatch) return '';
	return altMatch[2].trim();
}

function markdownTitleText(line: string): string | null {
	const match = line.match(/!\[[^\]]*\]\([^)]*\s+"([^"]*)"|!\[[^\]]*\]\([^)]*\s+'([^']*)'\)/);
	if (!match) return null;
	return (match[1] ?? match[2] ?? '').trim();
}

function htmlTitleText(line: string): string | null {
	const tagMatch = line.match(/<img\b[^>]*>/i);
	if (!tagMatch) return null;
	const titleMatch = tagMatch[0].match(/\btitle\s*=\s*(['"])(.*?)\1/i);
	if (!titleMatch) return null;
	return titleMatch[2].trim();
}

function validateImageRules(content: string, file: string): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const lines = content.split(/\r?\n/);

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const markdownImage = hasMarkdownImage(line);
		const htmlImage = hasHtmlImage(line);
		if (!markdownImage && !htmlImage) continue;

		const altText = markdownImage ? markdownAltText(line) : htmlAltText(line);
		if (!altText || altText.length === 0) {
			issues.push({
				file,
				message: `Image on line ${i + 1} is missing alt text`,
			});
		}

		const titleText = markdownImage ? markdownTitleText(line) : htmlTitleText(line);
		if (titleText === null || titleText.length === 0) {
			issues.push({
				file,
				message: `Image on line ${i + 1} is missing a title attribute (used as hover tooltip)`,
			});
		} else if (titleText.length < 20) {
			issues.push({
				file,
				message: `Image on line ${i + 1} title attribute must be descriptive (>= 20 characters)`,
			});
		}
	}

	return issues;
}

async function main(): Promise<void> {
	const files = await fg(DOCS_GLOB, { dot: false, onlyFiles: true });
	if (files.length === 0) {
		console.error(`No docs found for validation at ${DOCS_GLOB}`);
		process.exit(1);
	}

	const issues: ValidationIssue[] = [];

	for (const file of files) {
		const raw = await fs.readFile(file, 'utf8');
		const parsed = matter(raw);
		const content = parsed.content;
		const relativeFile = toPosix(path.relative(process.cwd(), file));

		issues.push(...validateRequiredSections(content, relativeFile));
		issues.push(...validateDisallowedPhrases(content, relativeFile));
		issues.push(...validateImageRules(content, relativeFile));
	}

	if (issues.length > 0) {
		console.error('Document validation failed:');
		for (const issue of issues) {
			console.error(`- ${issue.file}: ${issue.message}`);
		}
		process.exit(1);
	}

	console.log(`Docs validation passed for ${files.length} file(s).`);
}

void main();
