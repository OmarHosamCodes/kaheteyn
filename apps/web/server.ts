import { stat } from "node:fs/promises";
import { join, normalize } from "node:path";
import { file } from "bun";
import handler from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;
const clientDir = join(import.meta.dir, "dist", "client");

async function tryServeStatic(pathname: string): Promise<Response | null> {
	// Prevent path traversal
	const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
	const filePath = join(clientDir, safePath);
	if (!filePath.startsWith(clientDir)) return null;

	try {
		const s = await stat(filePath);
		if (!s.isFile()) return null;
	} catch {
		return null;
	}

	const f = file(filePath);
	const headers: Record<string, string> = {};
	// Long cache for hashed assets, shorter for everything else
	if (pathname.startsWith("/assets/")) {
		headers["Cache-Control"] = "public, max-age=31536000, immutable";
	} else {
		headers["Cache-Control"] = "public, max-age=3600";
	}
	return new Response(f, { headers });
}

const server = Bun.serve({
	port,
	async fetch(request: Request) {
		const url = new URL(request.url);
		// Serve client static assets (Vite-built JS/CSS, public files)
		if (request.method === "GET" || request.method === "HEAD") {
			const staticResponse = await tryServeStatic(url.pathname);
			if (staticResponse) return staticResponse;
		}
		return handler.fetch(request);
	},
});

console.log(`Server listening on http://localhost:${server.port}`);
