import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 4321);

const contentTypes = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
	'.webp': 'image/webp',
	'.xml': 'application/xml; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

async function fileExists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function safePathname(urlPath) {
	const decoded = decodeURIComponent(urlPath.split('?')[0]);
	const normalized = path.posix.normalize(decoded);
	return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

async function resolveFile(urlPath) {
	const pathname = safePathname(urlPath);
	let relativePath = pathname === '/' ? '/index.html' : pathname;

	if (!path.extname(relativePath)) {
		relativePath = relativePath.endsWith('/') ? `${relativePath}index.html` : `${relativePath}/index.html`;
	}

	const candidate = path.join(distDir, relativePath);
	const normalizedCandidate = path.normalize(candidate);
	if (!normalizedCandidate.startsWith(distDir)) {
		return path.join(distDir, '404.html');
	}

	if (await fileExists(normalizedCandidate)) {
		return normalizedCandidate;
	}

	return path.join(distDir, '404.html');
}

const server = http.createServer(async (request, response) => {
	const filePath = await resolveFile(request.url || '/');
	const exists = await fileExists(filePath);
	const statusCode = exists && !filePath.endsWith('404.html') ? 200 : 404;
	const extension = path.extname(filePath);
	const contentType = contentTypes[extension] || 'application/octet-stream';

	response.writeHead(statusCode, {
		'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
		'Content-Type': contentType,
		'X-Content-Type-Options': 'nosniff',
	});

	if (!exists) {
		response.end('Not Found');
		return;
	}

	createReadStream(filePath).pipe(response);
});

server.listen(port, '0.0.0.0', () => {
	console.log(`Serving static site from ${distDir} on port ${port}`);
});