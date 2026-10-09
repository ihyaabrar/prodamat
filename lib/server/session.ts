import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { activityId, db } from "./db";
import { HttpError } from "./http";

type Role = "siswa" | "pendamping";
const COOKIE: Record<Role, string> = { siswa: "prodamat_siswa", pendamping: "prodamat_pendamping" };
const MAX_AGE: Record<Role, number> = { siswa: 60 * 60 * 24 * 7, pendamping: 60 * 60 * 12 };

const hash = (token: string) => createHash("sha256").update(token).digest("base64url");

export async function createSession(role: Role, participantId: string | null, client: PoolClient | typeof db = db) {
  const token = randomBytes(32).toString("base64url");
  await client.query("insert into session (token_hash, role, activity_id, participant_id, expires_at) values ($1, $2, $3, $4, now() + make_interval(secs => $5))", [hash(token), role, activityId(), participantId, MAX_AGE[role]]);
  return token;
}

export function setSessionCookie(response: NextResponse, role: Role, token: string) {
  response.cookies.set(COOKIE[role], token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE[role] });
  return response;
}

export async function endSession(request: NextRequest, response: NextResponse, role: Role) {
  const token = request.cookies.get(COOKIE[role])?.value;
  if (token) await db.query("delete from session where token_hash = $1", [hash(token)]);
  response.cookies.delete(COOKIE[role]);
}

async function lookup(request: NextRequest, role: Role) {
  const token = request.cookies.get(COOKIE[role])?.value;
  if (!token) return null;
  const { rows } = await db.query<{ participant_id: string | null }>("select participant_id from session where token_hash = $1 and role = $2 and activity_id = $3 and expires_at > now()", [hash(token), role, activityId()]);
  return rows[0] ?? null;
}

export async function participantSession(request: NextRequest) {
  return (await lookup(request, "siswa"))?.participant_id ?? null;
}

export async function requireParticipant(request: NextRequest) {
  const id = await participantSession(request);
  if (!id) throw new HttpError(401, "Sesi berakhir. Masuk lagi dengan nama dan kelasmu.");
  return id;
}

export async function requirePendamping(request: NextRequest) {
  if (!(await lookup(request, "pendamping"))) throw new HttpError(401, "Masuk sebagai pendamping dulu.");
}
