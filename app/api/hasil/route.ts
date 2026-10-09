import { getResults } from "@/lib/server/data";
import { handle, ok } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/session";

export const GET = handle(async request => ok(await getResults(await requireParticipant(request))));
