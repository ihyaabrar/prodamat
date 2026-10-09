import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/server/db";
import { getPhase } from "@/lib/server/data";
import { assertSameOrigin, clientIp, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { createSession, setSessionCookie } from "@/lib/server/session";

// Semua Chromebook di Wi-Fi sekolah memakai satu IP publik, jadi batasnya longgar agar anak iseng tidak mengunci pendamping.
const MAX_FAILURES = 30;
const digest = (value: string) => createHash("sha256").update(value).digest();

export const POST = handle(async request => {
  assertSameOrigin(request);
  const expected = process.env.PENDAMPING_PASSWORD;
  if (!expected) throw new HttpError(503, "Kata sandi pendamping belum diatur di server.");
  const ip = clientIp(request);
  const { rows } = await db.query<{ count: string }>("select count(*) from login_failure where ip = $1 and at > now() - interval '15 minutes'", [ip]);
  if (Number(rows[0].count) >= MAX_FAILURES) throw new HttpError(429, "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi.");
  const { password } = await readJson(request);
  if (typeof password !== "string" || !timingSafeEqual(digest(password), digest(expected))) {
    await db.query("insert into login_failure (ip) values ($1)", [ip]);
    throw new HttpError(401, "Kata sandi salah.");
  }
  await getPhase();
  await db.query("delete from login_failure where ip = $1 or at < now() - interval '1 day'", [ip]);
  await db.query("delete from session where expires_at < now()");
  return setSessionCookie(ok({ ok: true }), "pendamping", await createSession("pendamping", null));
});
