// Tipe dan aturan yang aman dipakai di browser. Kunci jawaban dan skoring ada di lib/server/content.ts.

export type TestKind = "pretest" | "posttest";
export type Phase = TestKind | "learning" | "closed";
export type ClassName = "V" | "VI";
export type PublicQuestion = { id: number; text: string; options: string[] };
export type Question = PublicQuestion & { correct: number };
export type Attempt = { answers: (number | null)[]; submittedAt: string | null; startedAt?: string | null };
export type Participant = { code: string; name: string; className: ClassName; pretest: Attempt | null; posttest: Attempt | null };
export type Me = { phase: Phase; participant: Participant | null; aiko3d: boolean };
export type TestReview = { answers: number[]; correct: number[]; explanations: string[]; questions: PublicQuestion[] };
// Pembahasan (berisi kunci) baru dikirim saat tahap Selesai, agar tidak tersebar ke teman yang masih mengerjakan.
export type Results = { scores: Record<TestKind, number>; review: Record<TestKind, TestReview> | null };
export type RekapParticipant = Participant & { scores: Record<TestKind, number | null> };
export type Prize = { mostActive: string | null; goodScore: number };
export type Rekap = { phase: Phase; aiko3d: boolean; sample: boolean; prize: Prize; participants: RekapParticipant[]; questions: Record<TestKind, Question[]> };

export const RESET_PHRASE = "MULAI BARU";
export const phaseLabels: Record<Phase, string> = { pretest: "Pretest dibuka", learning: "Waktu belajar", posttest: "Posttest dibuka", closed: "Sesi ditutup" };
export const isPhase = (value: unknown): value is Phase => typeof value === "string" && Object.hasOwn(phaseLabels, value);
export const isTestKind = (value: unknown): value is TestKind => value === "pretest" || value === "posttest";
export const isClassName = (value: unknown): value is ClassName => value === "V" || value === "VI";

export const normalizeName = (name: string) => name.normalize("NFC").trim().replace(/\s+/g, " ");
export const nameKey = (name: string) => normalizeName(name).toLocaleLowerCase("id-ID");
export const validName = (name: string) => normalizeName(name).length >= 2 && normalizeName(name).length <= 60 && /\p{L}/u.test(name) && !/[\u0000-\u001f\u007f]/u.test(name);

export function blankAnswers(): (number | null)[] { return Array<number | null>(10).fill(null); }

export function canStart(participant: Participant, phase: Phase, kind: TestKind): boolean {
  return phase === kind && !participant[kind]?.submittedAt && (kind === "pretest" || !!participant.pretest?.submittedAt);
}

// Peringkat memakai total pretest + posttest, sama dengan hadiah Nilai Terbaik; total sama berbagi peringkat.
export function ranking(participants: RekapParticipant[]) {
  const completed = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null)
    .map(participant => ({ participant, points: participant.scores.pretest! + participant.scores.posttest! }))
    .sort((a, b) => b.points - a.points || a.participant.name.localeCompare(b.participant.name, "id-ID"));
  let rank = 0;
  return completed.map((item, index) => { if (index === 0 || item.points !== completed[index - 1].points) rank = index + 1; return { ...item, rank }; });
}

// Pemenang apresiasi (keputusan tim): Nilai Terbaik, Tercepat dengan Hasil Bagus, dan Teraktif.
// Teraktif dipilih pendamping saat acara dan tidak ikut dihitung untuk dua hadiah lain; satu anak satu hadiah.
// - Nilai Terbaik: total pretest + posttest, lalu posttest, lalu poin soal sulit.
// - Tercepat: di antara yang posttest-nya minimal batas "hasil bagus", total waktu pretest + posttest paling
//   singkat, lalu posttest, lalu poin soal sulit. Waktu per tes = jawaban pertama sampai kirim, jadi anak yang
//   datang terlambat tidak dirugikan.
// Poin soal sulit = jumlah, untuk setiap soal posttest yang dijawab benar, banyaknya peserta selesai yang salah
// di soal itu. Bilangan bulat, jadi perbandingannya pasti.
export type AwardKey = "best" | "fastest";
export type AwardCriterion = "total" | "score" | "hard" | "time";
export type AwardEntry = { participant: RekapParticipant; post: number; pre: number; total: number; hard: number; seconds: number | null };
export type Award = { key: AwardKey; title: string; order: AwardCriterion[]; winners: AwardEntry[]; runnerUp: AwardEntry | null; decidedBy: AwardCriterion | null; empty: string | null };

const duration = (attempt: Attempt | null) => {
  if (!attempt?.startedAt || !attempt.submittedAt) return null;
  const seconds = (Date.parse(attempt.submittedAt) - Date.parse(attempt.startedAt)) / 1000;
  return seconds >= 0 ? Math.round(seconds) : null;
};

export function awards(participants: RekapParticipant[], questions: Question[], prize: Prize): Award[] {
  const done = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null && item.posttest);
  const wrong = questions.map((question, index) => done.filter(item => item.posttest!.answers[index] !== question.correct).length);
  const entries: AwardEntry[] = done.filter(item => item.code !== prize.mostActive).map(participant => {
    const post = participant.scores.posttest!, pre = participant.scores.pretest!;
    const hard = questions.reduce((sum, question, index) => sum + (participant.posttest!.answers[index] === question.correct ? wrong[index] : 0), 0);
    const pretestTime = duration(participant.pretest), posttestTime = duration(participant.posttest);
    return { participant, post, pre, total: pre + post, hard, seconds: pretestTime !== null && posttestTime !== null ? pretestTime + posttestTime : null };
  });
  const value: Record<AwardCriterion, (entry: AwardEntry) => number> = { total: entry => entry.total, score: entry => entry.post, hard: entry => entry.hard, time: entry => -(entry.seconds ?? Infinity) };
  const decide = (key: AwardKey, title: string, pool: AwardEntry[], order: AwardCriterion[], empty: string): Award => {
    const sorted = [...pool].sort((a, b) => { for (const criterion of order) { const diff = value[criterion](b) - value[criterion](a); if (diff) return diff; } return a.participant.name.localeCompare(b.participant.name, "id-ID"); });
    if (!sorted.length) return { key, title, order, winners: [], runnerUp: null, decidedBy: null, empty };
    const same = (a: AwardEntry, b: AwardEntry) => order.every(criterion => value[criterion](a) === value[criterion](b));
    const winners = sorted.filter(entry => same(entry, sorted[0]));
    const runnerUp = sorted[winners.length] ?? null;
    const decidedBy = runnerUp ? order.find(criterion => value[criterion](sorted[0]) !== value[criterion](runnerUp))! : null;
    return { key, title, order, winners, runnerUp, decidedBy, empty: null };
  };
  const best = decide("best", "Nilai Terbaik", entries, ["total", "score", "hard"], "Belum ada siswa yang menyelesaikan kedua tes.");
  const taken = new Set(best.winners.map(entry => entry.participant.code));
  const fastest = decide("fastest", "Tercepat dengan Hasil Bagus", entries.filter(entry => !taken.has(entry.participant.code) && entry.post >= prize.goodScore && entry.seconds !== null), ["time", "score", "hard"],
    `Belum ada siswa lain dengan posttest minimal ${prize.goodScore}/10 yang waktunya tercatat.`);
  return [best, fastest];
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return minutes ? (rest ? `${minutes} menit ${rest} detik` : `${minutes} menit`) : `${rest} detik`;
}

export function csvCell(value: string | number): string {
  const text = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
