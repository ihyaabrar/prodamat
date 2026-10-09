import { publicQuestions } from "@/lib/server/content";
import { handle, ok } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/session";

// Soal dan pilihan tanpa kunci jawaban.
export const GET = handle(async request => {
  await requireParticipant(request);
  return ok(publicQuestions());
});
