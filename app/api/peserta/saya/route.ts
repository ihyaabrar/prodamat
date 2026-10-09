import { NextResponse } from "next/server";
import { getMe } from "@/lib/server/data";
import { assertSameOrigin, handle, ok } from "@/lib/server/http";
import { endSession, participantSession } from "@/lib/server/session";

export const GET = handle(async request => ok(await getMe(await participantSession(request))));

// Ganti peserta: akhiri sesi di perangkat ini. Jawaban tetap tersimpan.
export const DELETE = handle(async request => {
  assertSameOrigin(request);
  const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  await endSession(request, response, "siswa");
  return response;
});
