import { getAiko3d, setAiko3d } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

// Saklar Aiko 3D untuk semua perangkat siswa.
export const PATCH = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  const { enabled } = await readJson(request);
  if (typeof enabled !== "boolean") throw new HttpError(400, "Pilihan Aiko 3D tidak dikenali.");
  await setAiko3d(enabled);
  return ok({ aiko3d: await getAiko3d() });
});
