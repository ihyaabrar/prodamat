// Tipe dan aturan yang aman dipakai di browser. Kunci jawaban dan skoring ada di lib/server/content.ts.

export type TestKind = "pretest" | "posttest";
export type Phase = TestKind | "learning" | "closed";
export type ClassName = "V" | "VI";
export type PublicQuestion = { id: number; text: string; options: string[] };
export type Question = PublicQuestion & { correct: number };
export type Attempt = { answers: (number | null)[]; submittedAt: string | null };
export type Participant = { code: string; name: string; className: ClassName; pretest: Attempt | null; posttest: Attempt | null };
export type Me = { phase: Phase; participant: Participant | null };
export type TestResult = { score: number; answers: number[]; correct: number[]; explanations: string[]; questions: PublicQuestion[] };
export type Results = Record<TestKind, TestResult>;
export type RekapParticipant = Participant & { scores: Record<TestKind, number | null> };
export type Rekap = { phase: Phase; sample: boolean; participants: RekapParticipant[]; questions: Record<TestKind, Question[]> };

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

export function csvCell(value: string | number): string {
  const text = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
