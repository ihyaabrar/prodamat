import { getPrize, setPrize } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pemenang apresiasi yang diatur pendamping: siswa teraktif (atau null untuk membatalkan) dan batas "hasil bagus".
export const PATCH = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  const { mostActive, goodScore } = await readJson(request);
  if (mostActive !== undefined && mostActive !== null && (typeof mostActive !== "string" || !UUID.test(mostActive))) throw new HttpError(400, "Pilihan siswa teraktif tidak dikenali.");
  if (goodScore !== undefined && !(typeof goodScore === "number" && Number.isInteger(goodScore) && goodScore >= 1 && goodScore <= 10)) throw new HttpError(400, "Batas nilai harus 1 sampai 10.");
  if (mostActive === undefined && goodScore === undefined) throw new HttpError(400, "Tidak ada yang diubah.");
  await setPrize({ mostActive: mostActive as string | null | undefined, goodScore: goodScore as number | undefined });
  return ok({ prize: await getPrize() });
});
