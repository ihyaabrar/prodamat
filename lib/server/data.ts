import "server-only";
import { nameKey, type Attempt, type ClassName, type Me, type Participant, type Phase, type RekapParticipant, type Results, type TestKind } from "../model";
import { activityId, db, transaction } from "./db";
import { answerKey, explanations, publicQuestions } from "./content";
import { HttpError } from "./http";

export async function getPhase(): Promise<Phase> {
  const { rows } = await db.query<{ phase: Phase }>(
    "with created as (insert into activity (id) values ($1) on conflict (id) do nothing returning phase) select phase from created union all select phase from activity where id = $1 limit 1",
    [activityId()],
  );
  if (rows[0]) return rows[0].phase;
  // Permintaan yang kalah balapan saat membuat baris pertama tidak melihat baris itu di snapshot yang sama; baca ulang.
  const again = await db.query<{ phase: Phase }>("select phase from activity where id = $1", [activityId()]);
  return again.rows[0].phase;
}

// Baris kegiatan dibuat oleh getPhase; bila belum ada, saklar dianggap aktif (nilai bawaan kolom).
export async function getAiko3d(): Promise<boolean> {
  const { rows } = await db.query<{ aiko3d: boolean }>("select aiko3d from activity where id = $1", [activityId()]);
  return rows[0]?.aiko3d ?? true;
}

export async function setAiko3d(enabled: boolean) {
  await getPhase();
  await db.query("update activity set aiko3d = $2, updated_at = now() where id = $1", [activityId(), enabled]);
}

export async function setPhase(phase: Phase) {
  await getPhase();
  await db.query("update activity set phase = $2, updated_at = now() where id = $1", [activityId(), phase]);
}

type Row = { id: string; name: string; class_name: ClassName; kind: TestKind | null; answers: (number | null)[] | null; submitted_at: Date | null; score: number | null };
const PARTICIPANT_ROWS = "select p.id, p.name, p.class_name, a.kind, a.answers, a.submitted_at, a.score from participant p left join attempt a on a.participant_id = p.id";

function collect(rows: Row[]): RekapParticipant[] {
  const byId = new Map<string, RekapParticipant>();
  for (const row of rows) {
    let item = byId.get(row.id);
    if (!item) { item = { code: row.id, name: row.name, className: row.class_name, pretest: null, posttest: null, scores: { pretest: null, posttest: null } }; byId.set(row.id, item); }
    if (row.kind && row.answers) {
      const attempt: Attempt = { answers: row.answers, submittedAt: row.submitted_at?.toISOString() ?? null };
      item[row.kind] = attempt;
      item.scores[row.kind] = row.submitted_at ? row.score : null;
    }
  }
  return [...byId.values()];
}

export async function getParticipant(id: string): Promise<Participant | null> {
  const { rows } = await db.query<Row>(`${PARTICIPANT_ROWS} where p.id = $1 and p.activity_id = $2`, [id, activityId()]);
  const [item] = collect(rows);
  if (!item) return null;
  const { scores: _scores, ...participant } = item;
  return participant;
}

export async function getMe(participantId: string | null): Promise<Me> {
  const [phase, participant, aiko3d] = await Promise.all([getPhase(), participantId ? getParticipant(participantId) : null, getAiko3d()]);
  return { phase, participant, aiko3d };
}

export async function listParticipants(): Promise<RekapParticipant[]> {
  const { rows } = await db.query<Row>(`${PARTICIPANT_ROWS} where p.activity_id = $1 order by p.created_at, p.id`, [activityId()]);
  return collect(rows);
}

// Kondisi yang sama untuk menyimpan dan mengirim: fase cocok, belum dikirim, dan posttest butuh pretest terkirim.
const OPEN_ATTEMPT = `a.participant_id = $1 and a.kind = $2 and a.submitted_at is null
  and exists (select 1 from activity where id = $3 and phase = $2)
  and ($2 = 'pretest' or exists (select 1 from attempt p where p.participant_id = $1 and p.kind = 'pretest' and p.submitted_at is not null))`;

export async function saveAnswer(participantId: string, kind: TestKind, index: number, answer: number) {
  await db.query("insert into attempt (participant_id, kind) select $1, $2 where exists (select 1 from activity where id = $3 and phase = $2) on conflict do nothing", [participantId, kind, activityId()]);
  const { rows } = await db.query<{ answers: (number | null)[] }>(
    `update attempt a set answers[$4] = $5, revision = a.revision + 1, updated_at = now() where ${OPEN_ATTEMPT} returning a.answers`,
    [participantId, kind, activityId(), index + 1, answer],
  );
  if (!rows[0]) throw new HttpError(409, "Tes ini sedang tidak dibuka. Kembali ke halaman petualangan.");
  return rows[0].answers;
}

export async function submitAttempt(participantId: string, kind: TestKind) {
  const { rows } = await db.query<{ score: number }>(
    `update attempt a set submitted_at = now(), updated_at = now(),
       score = (select count(*) from unnest(a.answers, $4::smallint[]) as pair(given, correct) where given = correct)
     where ${OPEN_ATTEMPT} and array_position(a.answers, null) is null
     returning a.score`,
    [participantId, kind, activityId(), answerKey(kind)],
  );
  if (rows[0]) return;
  const current = await db.query<{ submitted_at: Date | null; answers: (number | null)[] }>("select submitted_at, answers from attempt where participant_id = $1 and kind = $2", [participantId, kind]);
  if (current.rows[0]?.submitted_at) return;
  if (current.rows[0] && current.rows[0].answers.some(answer => answer === null)) throw new HttpError(409, "Masih ada soal yang belum dijawab.");
  throw new HttpError(409, "Tes ini sedang tidak dibuka. Kembali ke halaman petualangan.");
}

export async function getResults(participantId: string): Promise<Results> {
  const participant = await getParticipant(participantId);
  if (!participant?.pretest?.submittedAt || !participant.posttest?.submittedAt) throw new HttpError(403, "Hasil bisa dilihat setelah pretest dan posttest selesai.");
  const shown = publicQuestions();
  const answers = (kind: TestKind) => participant[kind]!.answers as number[];
  const score = (kind: TestKind) => answerKey(kind).reduce((total, correct, index) => total + Number(answers(kind)[index] === correct), 0);
  const review = (kind: TestKind) => ({ answers: answers(kind), correct: answerKey(kind), explanations: explanations[kind], questions: shown[kind] });
  const open = (await getPhase()) === "closed";
  return { scores: { pretest: score("pretest"), posttest: score("posttest") }, review: open ? { pretest: review("pretest"), posttest: review("posttest") } : null };
}

// Pendamping membetulkan nama atau kelas. Sesi siswa tetap tersambung karena terikat ke ID peserta.
export async function updateParticipant(id: string, name: string, className: ClassName) {
  try {
    const { rowCount } = await db.query("update participant set name = $3, name_key = $4, class_name = $5 where id = $1 and activity_id = $2", [id, activityId(), name, nameKey(name), className]);
    if (!rowCount) throw new HttpError(404, "Siswa ini sudah tidak ada. Muat ulang dashboard.");
  } catch (error) {
    if ((error as { code?: string }).code === "23505") throw new HttpError(409, `Sudah ada siswa bernama ${name} di kelas ${className}.`);
    throw error;
  }
}

// Menghapus siswa beserta jawaban dan sesinya (cascade).
export async function deleteParticipant(id: string) {
  const { rowCount } = await db.query("delete from participant where id = $1 and activity_id = $2", [id, activityId()]);
  if (!rowCount) throw new HttpError(404, "Siswa ini sudah tidak ada. Muat ulang dashboard.");
}

// Sesi baru: hapus semua siswa kegiatan ini dan kembali ke tahap pretest. Sesi pendamping tetap berlaku.
export async function resetActivity() {
  await getPhase();
  await transaction(async client => {
    await client.query("delete from participant where activity_id = $1", [activityId()]);
    await client.query("update activity set phase = 'pretest', updated_at = now() where id = $1", [activityId()]);
  });
}
