export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const TIMEOUT_MS = 10000;

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      // Wi-Fi sekolah bisa tersendat; permintaan yang menggantung dihentikan agar bisa dicoba ulang.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, "Internet sedang terputus. Tunggu sebentar, lalu coba lagi. Kalau masih belum bisa, angkat tangan dan panggil kakak pendamping.");
  }
  const data = await response.json().catch(() => null);
  if (response.ok && data === null) throw new ApiError(0, "Internet sedang terputus. Tunggu sebentar, lalu coba lagi.");
  if (!response.ok) throw new ApiError(response.status, typeof data?.error === "string" ? data.error : "Ada gangguan kecil. Tunggu sebentar, lalu coba lagi.");
  return data as T;
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi.";
export const errorStatus = (error: unknown) => error instanceof ApiError ? error.status : 0;
