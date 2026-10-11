// Tipe dan aturan yang aman dipakai di browser. Kunci jawaban dan skoring ada di lib/server/content.ts.

export type TestKind = "pretest" | "posttest";
export type Phase = TestKind | "learning" | "closed";
export type ClassName = "V" | "VI";
export type PublicQuestion = { id: number; text: string; options: string[] };
export type Question = PublicQuestion & { correct: number };
export type Attempt = { answers: (number | null)[]; submittedAt: string | null };
export type Participant = { code: string; name: string; className: ClassName; pretest: Attempt | null; posttest: Attempt | null };
export type Me = { phase: Phase; participant: Participant | null; aiko3d: boolean };
export type TestReview = { answers: number[]; correct: number[]; explanations: string[]; questions: PublicQuestion[] };
// Pembahasan (berisi kunci) baru dikirim saat tahap Selesai, agar tidak tersebar ke teman yang masih mengerjakan.
export type Results = { scores: Record<TestKind, number>; review: Record<TestKind, TestReview> | null };
export type RekapParticipant = Participant & { scores: Record<TestKind, number | null> };
export type Rekap = { phase: Phase; aiko3d: boolean; sample: boolean; participants: RekapParticipant[]; questions: Record<TestKind, Question[]> };

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

export function ranking(participants: RekapParticipant[]) {
  const completed = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null)
    .map(participant => ({ participant, points: participant.scores.posttest! }))
    .sort((a, b) => b.points - a.points || a.participant.name.localeCompare(b.participant.name, "id-ID"));
  let rank = 0;
  return completed.map((item, index) => { if (index === 0 || item.points !== completed[index - 1].points) rank = index + 1; return { ...item, rank }; });
}

// Pemenang apresiasi (3 hadiah di proposal): Terbaik Kelas V, Terbaik Kelas VI, Juara Peningkatan.
// Hanya siswa yang menyelesaikan kedua tes. Satu anak paling banyak satu hadiah. Waktu kirim tidak dipakai
// sebagai penentu karena anak diberi tahu tidak perlu buru-buru. Penentu seri, berurutan:
// - Terbaik kelas: nilai posttest, lalu poin soal sulit, lalu peningkatan.
// - Peningkatan: selisih posttest dan pretest (harus naik), lalu nilai posttest, lalu poin soal sulit.
// Poin soal sulit = jumlah, untuk setiap soal posttest yang dijawab benar, banyaknya peserta selesai yang salah
// di soal itu. Bilangan bulat, jadi perbandingannya pasti.
export type AwardKey = "class-V" | "class-VI" | "improvement";
export type AwardEntry = { participant: RekapParticipant; post: number; pre: number; gain: number; hard: number };
export type Award = { key: AwardKey; title: string; winners: AwardEntry[]; runnerUp: AwardEntry | null; decidedBy: "score" | "hard" | "gain" | null; empty: string | null };

export function awards(participants: RekapParticipant[], questions: Question[]): Award[] {
  const done = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null && item.posttest);
  const wrong = questions.map((question, index) => done.filter(item => item.posttest!.answers[index] !== question.correct).length);
  const entries: AwardEntry[] = done.map(participant => {
    const post = participant.scores.posttest!, pre = participant.scores.pretest!;
    const hard = questions.reduce((sum, question, index) => sum + (participant.posttest!.answers[index] === question.correct ? wrong[index] : 0), 0);
    return { participant, post, pre, gain: post - pre, hard };
  });
  type Key = "score" | "hard" | "gain";
  const best: [Key, (entry: AwardEntry) => number][] = [["score", entry => entry.post], ["hard", entry => entry.hard], ["gain", entry => entry.gain]];
  const growth: [Key, (entry: AwardEntry) => number][] = [["gain", entry => entry.gain], ["score", entry => entry.post], ["hard", entry => entry.hard]];
  const decide = (key: AwardKey, title: string, pool: AwardEntry[], order: [Key, (entry: AwardEntry) => number][], empty: string): Award => {
    const sorted = [...pool].sort((a, b) => { for (const [, value] of order) { const diff = value(b) - value(a); if (diff) return diff; } return a.participant.name.localeCompare(b.participant.name, "id-ID"); });
    if (!sorted.length) return { key, title, winners: [], runnerUp: null, decidedBy: null, empty };
    const same = (a: AwardEntry, b: AwardEntry) => order.every(([, value]) => value(a) === value(b));
    const winners = sorted.filter(entry => same(entry, sorted[0]));
    const runnerUp = sorted[winners.length] ?? null;
    const decidedBy = runnerUp ? order.find(([, value]) => value(sorted[0]) !== value(runnerUp))![0] : null;
    return { key, title, winners, runnerUp, decidedBy, empty: null };
  };
  const classV = decide("class-V", "Terbaik Kelas V", entries.filter(entry => entry.participant.className === "V"), best, "Belum ada siswa kelas V yang menyelesaikan kedua tes.");
  const classVI = decide("class-VI", "Terbaik Kelas VI", entries.filter(entry => entry.participant.className === "VI"), best, "Belum ada siswa kelas VI yang menyelesaikan kedua tes.");
  const taken = new Set([...classV.winners, ...classVI.winners].map(entry => entry.participant.code));
  const improvement = decide("improvement", "Juara Peningkatan", entries.filter(entry => !taken.has(entry.participant.code) && entry.gain > 0), growth, "Belum ada siswa lain yang nilainya naik dari pretest ke posttest.");
  return [classV, classVI, improvement];
}

export function csvCell(value: string | number): string {
  const text = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
