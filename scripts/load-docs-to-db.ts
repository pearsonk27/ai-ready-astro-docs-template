import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

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

const EXPORT_PATH = path.join(process.cwd(), 'generated/docs.export.json');

async function ensureTable(client: Client): Promise<void> {
	await client.query(`
		CREATE TABLE IF NOT EXISTS docs (
			id TEXT PRIMARY KEY,
			title TEXT,
			content TEXT,
			metadata JSONB,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`);
}

async function upsertDoc(client: Client, doc: ExportedDoc): Promise<void> {
	const metadata = {
		...doc.metadata,
		sections: doc.sections,
		source_path: doc.source_path,
	};

	await client.query(
		`INSERT INTO docs (id, title, content, metadata)
		 VALUES ($1, $2, $3, $4::jsonb)
		 ON CONFLICT (id)
		 DO UPDATE SET
			title = EXCLUDED.title,
			content = EXCLUDED.content,
			metadata = EXCLUDED.metadata`,
		[doc.id, doc.title, doc.raw_content, JSON.stringify(metadata)]
	);
}

async function main(): Promise<void> {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('DATABASE_URL is required.');
		process.exit(1);
	}

	const raw = await fs.readFile(EXPORT_PATH, 'utf8');
	const docs = JSON.parse(raw) as ExportedDoc[];

	const client = new Client({ connectionString: databaseUrl });
	await client.connect();

	try {
		await ensureTable(client);
		for (const doc of docs) {
			await upsertDoc(client, doc);
		}
		console.log(`Upserted ${docs.length} docs into PostgreSQL.`);
	} finally {
		await client.end();
	}
}

void main();
