import { isClassName, normalizeName, validName } from "@/lib/model";
import { deleteParticipant, updateParticipant } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const participantId = (value: unknown) => {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, "Siswa tidak dikenali.");
  return value;
};

export const PATCH = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  const body = await readJson(request);
  const id = participantId(body.id);
  const name = typeof body.name === "string" ? normalizeName(body.name) : "";
  if (!validName(name) || !isClassName(body.className)) throw new HttpError(400, "Nama minimal 2 huruf dan kelas harus 5 atau 6.");
  await updateParticipant(id, name, body.className);
  return ok({ ok: true });
});

export const DELETE = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  await deleteParticipant(participantId((await readJson(request)).id));
  return ok({ ok: true });
});
