import { RESET_PHRASE } from "@/lib/model";
import { resetActivity } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

// Menghapus semua siswa dan jawaban kegiatan ini. Kalimat konfirmasi juga diperiksa di server.
export const POST = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  const { confirm } = await readJson(request);
  if (typeof confirm !== "string" || confirm.trim().toUpperCase() !== RESET_PHRASE) throw new HttpError(400, `Ketik ${RESET_PHRASE} untuk melanjutkan.`);
  await resetActivity();
  return ok({ ok: true });
});
