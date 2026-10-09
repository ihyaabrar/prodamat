import "server-only";
import { NextResponse, type NextRequest } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, { ...init, headers: { "cache-control": "no-store", ...init?.headers } });
export const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });

// Permintaan yang mengubah data harus datang dari halaman aplikasi ini sendiri.
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost = "";
  try { originHost = origin ? new URL(origin).host : ""; } catch {}
  if (!originHost || !host || originHost !== host) throw new HttpError(403, "Ada gangguan kecil. Muat ulang halaman, lalu coba lagi. Jawaban yang sudah tersimpan tidak hilang.");
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, "Data yang dikirim tidak terbaca.");
}

export function handle(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.message);
      console.error("API error", request.method, request.nextUrl.pathname, error instanceof Error ? error.message : "unknown");
      return fail(503, "Aplikasi sedang ramai dipakai. Tunggu sebentar, lalu coba lagi.");
    }
  };
}

export const clientIp = (request: NextRequest) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
