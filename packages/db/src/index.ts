import { env } from "@kaheteyn/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createDb() {
  const client = postgres(env.DATABASE_URL, {
    // Reasonable defaults for serverless / long-running Bun server.
    max: env.NODE_ENV === "production" ? 10 : 5,
    prepare: false,
  });

  return drizzle(client, { schema });
}

export const db = createDb();
