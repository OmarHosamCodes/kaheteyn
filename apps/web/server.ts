import handler from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port,
  fetch: handler.fetch,
});

console.log(`Server listening on http://localhost:${server.port}`);
