import { NextResponse } from "next/server";
import { assertSameOrigin, handle } from "@/lib/server/http";
import { endSession } from "@/lib/server/session";

export const POST = handle(async request => {
  assertSameOrigin(request);
  const response = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  await endSession(request, response, "pendamping");
  return response;
});
