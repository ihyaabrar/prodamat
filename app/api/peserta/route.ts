import { isClassName, nameKey, normalizeName, validName } from "@/lib/model";
import { activityId, transaction } from "@/lib/server/db";
import { getMe, getPhase } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { createSession, setSessionCookie } from "@/lib/server/session";

// Daftar baru, atau lanjutkan peserta dengan nama dan kelas yang sama.
export const POST = handle(async request => {
  assertSameOrigin(request);
  const body = await readJson(request);
  const name = typeof body.name === "string" ? normalizeName(body.name) : "";
  if (!validName(name) || !isClassName(body.className)) throw new HttpError(400, "Tulis nama minimal 2 huruf dan pilih kelasmu, ya.");
  const className = body.className;
  await getPhase();
  const { participantId, token } = await transaction(async client => {
    const { rows } = await client.query<{ id: string }>(
      "insert into participant (activity_id, name, name_key, class_name) values ($1, $2, $3, $4) on conflict (activity_id, class_name, name_key) do update set name_key = excluded.name_key returning id",
      [activityId(), name, nameKey(name), className],
    );
    return { participantId: rows[0].id, token: await createSession("siswa", rows[0].id, client) };
  });
  return setSessionCookie(ok(await getMe(participantId)), "siswa", token);
});
