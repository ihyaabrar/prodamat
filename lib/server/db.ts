import "server-only";
import { Pool, type PoolClient } from "pg";
import { attachDatabasePool } from "@vercel/functions";

// Satu pool per instance fungsi (Fluid compute memakai ulang instance); disimpan di globalThis agar hot reload tidak membuat pool baru.
const holder = globalThis as unknown as { prodamatPool?: Pool };

function createPool() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 5000, connectionTimeoutMillis: 10000 });
  // Neon bisa memutus koneksi idle; tanpa listener ini node-postgres menghentikan proses.
  pool.on("error", error => console.error("pg pool error", error.message));
  attachDatabasePool(pool);
  return pool;
}

export const db = holder.prodamatPool ??= createPool();

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export const activityId = () => process.env.PRODAMAT_ACTIVITY_ID || "prodamat-2026";
