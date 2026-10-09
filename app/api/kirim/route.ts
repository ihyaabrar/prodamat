import { isTestKind } from "@/lib/model";
import { getMe, submitAttempt } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/session";

// Nilai dihitung di server. Kiriman ulang untuk tes yang sudah terkirim tidak mengubah apa pun.
export const POST = handle(async request => {
  assertSameOrigin(request);
  const participantId = await requireParticipant(request);
  const { kind } = await readJson(request);
  if (!isTestKind(kind)) throw new HttpError(400, "Jenis tes tidak dikenali.");
  await submitAttempt(participantId, kind);
  return ok(await getMe(participantId));
});
