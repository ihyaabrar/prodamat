import { isTestKind } from "@/lib/model";
import { validAnswer } from "@/lib/server/content";
import { saveAnswer } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/session";

export const PUT = handle(async request => {
  assertSameOrigin(request);
  const participantId = await requireParticipant(request);
  const { kind, index, answer } = await readJson(request);
  if (!isTestKind(kind) || typeof index !== "number" || typeof answer !== "number" || !validAnswer(kind, index, answer)) throw new HttpError(400, "Pilihan jawaban tidak dikenali.");
  return ok({ answers: await saveAnswer(participantId, kind, index, answer) });
});
