// Menjalankan db/schema.sql lewat koneksi langsung (non-pooled), sesuai anjuran Neon untuk migrasi.
import { readFile } from "node:fs/promises";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_UNPOOLED belum ada. Jalankan `npx vercel env pull .env.local` dulu.");
  process.exit(1);
}

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  const { rows } = await client.query("select table_name from information_schema.tables where table_schema = 'public' order by table_name");
  console.log("Skema siap:", rows.map(row => row.table_name).join(", "));
} catch (error) {
  await client.query("rollback");
  console.error("Migrasi gagal:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
