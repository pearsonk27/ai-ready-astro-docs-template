import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { validateDocFiles, validateRawDoc } from './validate-docs';

const FIXTURE_ROOT = path.resolve('scripts/__fixtures__/validate-docs');

async function fixture(name: string): Promise<string> {
	return fs.readFile(path.join(FIXTURE_ROOT, name), 'utf8');
}

test('flags missing required sections', async () => {
	const raw = await fixture('invalid/missing-sections.md');
	const issues = validateRawDoc(raw, 'invalid/missing-sections.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('Missing required section: ## Examples')),
		'expected missing examples section issue'
	);
});

test('flags disallowed summary heading', async () => {
	const raw = await fixture('invalid/summary-heading.md');
	const issues = validateRawDoc(raw, 'invalid/summary-heading.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('Do not use ## Summary')),
		'expected summary heading issue'
	);
});

test('flags disallowed phrases', async () => {
	const raw = await fixture('invalid/disallowed-phrase.md');
	const issues = validateRawDoc(raw, 'invalid/disallowed-phrase.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('Contains disallowed phrase')),
		'expected disallowed phrase issue'
	);
});

test('flags markdown image without title', async () => {
	const raw = await fixture('invalid/markdown-missing-title.md');
	const issues = validateRawDoc(raw, 'invalid/markdown-missing-title.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('missing a title attribute')),
		'expected missing image title issue'
	);
});

test('flags markdown image with short title', async () => {
	const raw = await fixture('invalid/markdown-short-title.md');
	const issues = validateRawDoc(raw, 'invalid/markdown-short-title.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('must be descriptive (>= 20 characters)')),
		'expected short image title issue'
	);
});

test('flags html image without alt and title', async () => {
	const raw = await fixture('invalid/html-missing-alt-title.md');
	const issues = validateRawDoc(raw, 'invalid/html-missing-alt-title.md');

	assert.ok(
		issues.some((issue) => issue.message.includes('missing alt text')),
		'expected missing alt issue'
	);
	assert.ok(
		issues.some((issue) => issue.message.includes('missing a title attribute')),
		'expected missing html image title issue'
	);
});

test('passes valid document fixture', async () => {
	const raw = await fixture('valid/complete-doc.md');
	const issues = validateRawDoc(raw, 'valid/complete-doc.md');

	assert.equal(issues.length, 0);
});

test('validateDocFiles aggregates issues across files', async () => {
	const files = [
		path.join(FIXTURE_ROOT, 'invalid/missing-sections.md'),
		path.join(FIXTURE_ROOT, 'valid/complete-doc.md'),
	];

	const issues = await validateDocFiles(files);
	assert.ok(issues.length > 0, 'expected at least one issue from invalid fixture');
	assert.ok(
		issues.some((issue) => issue.file.endsWith('scripts/__fixtures__/validate-docs/invalid/missing-sections.md')),
		'expected issue to include relative fixture path'
	);
});
