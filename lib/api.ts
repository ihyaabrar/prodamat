export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Tidak tersambung ke internet. Periksa Wi-Fi lalu coba lagi.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, typeof data?.error === "string" ? data.error : "Terjadi kesalahan. Coba lagi sebentar lagi.");
  return data as T;
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi.";
export const errorStatus = (error: unknown) => error instanceof ApiError ? error.status : 0;
