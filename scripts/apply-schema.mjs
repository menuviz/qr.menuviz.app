import { readFile } from "fs/promises";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const sql = await readFile(new URL("../supabase-schema.sql", import.meta.url), "utf8");
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

await client.connect();

try {
  await client.query(sql);
  console.log("Supabase schema applied.");
} finally {
  await client.end();
}
