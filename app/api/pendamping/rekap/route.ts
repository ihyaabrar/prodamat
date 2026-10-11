import type { Rekap } from "@/lib/model";
import { questions, sampleParticipants } from "@/lib/server/content";
import { getAiko3d, getPhase, getPrize, listParticipants } from "@/lib/server/data";
import { handle, ok } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

// Peserta, jawaban, dan nilai untuk dashboard. ?contoh=1 mengembalikan data simulasi tanpa menyentuh data asli.
export const GET = handle(async request => {
  await requirePendamping(request);
  const sample = request.nextUrl.searchParams.get("contoh") === "1";
  const [phase, aiko3d, prize, participants] = await Promise.all([getPhase(), getAiko3d(), getPrize(), sample ? sampleParticipants() : listParticipants()]);
  return ok<Rekap>({ phase, aiko3d, sample, prize: sample ? { mostActive: null, goodScore: prize.goodScore } : prize, participants, questions });
});
