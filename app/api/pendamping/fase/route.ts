import { isPhase } from "@/lib/model";
import { getPhase, setPhase } from "@/lib/server/data";
import { assertSameOrigin, handle, HttpError, ok, readJson } from "@/lib/server/http";
import { requirePendamping } from "@/lib/server/session";

export const PATCH = handle(async request => {
  assertSameOrigin(request);
  await requirePendamping(request);
  const { phase } = await readJson(request);
  if (!isPhase(phase)) throw new HttpError(400, "Tahap kegiatan tidak dikenali.");
  await setPhase(phase);
  return ok({ phase: await getPhase() });
});
