import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://tapcetuser:tapcetpass@localhost:5432/tapcetdb",
});

export const db = drizzle(pool, { schema });
export { pool };
