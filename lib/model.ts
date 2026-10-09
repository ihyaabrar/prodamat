import questionData from "./questions.json";

export type TestKind = "pretest" | "posttest";
export type Phase = TestKind | "learning" | "closed";
export type Question = { id: number; text: string; options: string[]; correct: number };
export type Attempt = { answers: (number | null)[]; submittedAt: string | null };
export type ClassName = "V" | "VI";
export type Participant = { code: string; name: string; className: ClassName; pretest: Attempt | null; posttest: Attempt | null };
export type DemoStore = { version: 2; phase: Phase; activeCode: string | null; participants: Participant[] };

export const questions: Record<TestKind, Question[]> = questionData;
export const STORAGE_KEY = "prodamat.ai-demo.v1";
export const phaseLabels: Record<Phase, string> = { pretest: "Pretest dibuka", learning: "Waktu belajar", posttest: "Posttest dibuka", closed: "Sesi ditutup" };

export function createStore(): DemoStore {
  return { version: 2, phase: "pretest", activeCode: null, participants: [] };
}

export const normalizeName = (name: string) => name.normalize("NFC").trim().replace(/\s+/g, " ");
export const validName = (name: string) => normalizeName(name).length >= 2 && normalizeName(name).length <= 60 && /\p{L}/u.test(name) && !/[\u0000-\u001f\u007f]/u.test(name);
export function registerParticipant(store: DemoStore, name: string, className: ClassName, id: string): DemoStore {
  const normalized = normalizeName(name);
  if (!validName(normalized) || !["V", "VI"].includes(className)) return store;
  const existing = store.participants.find(item => item.className === className && item.name.toLocaleLowerCase("id-ID") === normalized.toLocaleLowerCase("id-ID"));
  return { ...store, activeCode: existing?.code ?? id, participants: existing ? store.participants : [...store.participants, { code: id, name: normalized, className, pretest: null, posttest: null }] };
}

export function ranking(participants: Participant[]) {
  const completed = participants.filter(item => !!item.pretest?.submittedAt && !!item.posttest?.submittedAt)
    .map(participant => ({ participant, points: score(participant.posttest, "posttest")! }))
    .sort((a, b) => b.points - a.points || a.participant.name.localeCompare(b.participant.name, "id-ID"));
  let rank = 0;
  return completed.map((item, index) => { if (index === 0 || item.points !== completed[index - 1].points) rank = index + 1; return { ...item, rank }; });
}

export function csvCell(value: string | number): string {
  const text = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function blankAttempt(): Attempt { return { answers: Array<number | null>(10).fill(null), submittedAt: null }; }
export function score(attempt: Attempt | null, kind: TestKind): number | null {
  if (!attempt?.submittedAt) return null;
  return questions[kind].reduce((total, question, index) => total + Number(attempt.answers[index] === question.correct), 0);
}
export function canStart(participant: Participant, phase: Phase, kind: TestKind): boolean {
  return phase === kind && !participant[kind]?.submittedAt && (kind === "pretest" || !!participant.pretest?.submittedAt);
}
export function isAttempt(value: unknown): value is Attempt | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const attempt = value as Partial<Attempt>;
  return Array.isArray(attempt.answers) && attempt.answers.length === 10 && attempt.answers.every(answer => answer === null || (Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) <= 3)) &&
    (attempt.submittedAt === null || (typeof attempt.submittedAt === "string" && !Number.isNaN(Date.parse(attempt.submittedAt)) && attempt.answers.every(answer => answer !== null)));
}
export function readStore(raw: string | null): DemoStore {
  if (!raw) return createStore();
  try {
    const parsed = JSON.parse(raw);
    if (![1, 2].includes(parsed.version) || !parsed.phase || !Object.hasOwn(phaseLabels, parsed.phase) || !Array.isArray(parsed.participants)) return createStore();
    const ids = new Set<string>();
    for (const [index, participant] of parsed.participants.entries()) {
      if (!participant || typeof participant.code !== "string" || !participant.code || ids.has(participant.code) || !["V", "VI"].includes(participant.className) || !isAttempt(participant.pretest) || !isAttempt(participant.posttest)) return createStore();
      ids.add(participant.code);
      if (parsed.version === 1) participant.name = `Peserta demo ${String(index + 1).padStart(2, "0")}`;
      if (typeof participant.name !== "string" || !validName(participant.name)) return createStore();
      if (participant.posttest?.submittedAt && !participant.pretest?.submittedAt) return createStore();
    }
    if (parsed.activeCode !== null && !ids.has(parsed.activeCode)) return createStore();
    if (parsed.version === 1) {
      parsed.participants = parsed.participants.filter((item: Participant) => item.pretest || item.posttest);
      parsed.version = 2;
      parsed.activeCode = null;
    }
    return parsed as DemoStore;
  } catch { return createStore(); }
}

export function sampleParticipants(): Participant[] {
  const names = ["Alya Putri", "Bima Pratama", "Citra Lestari", "Daffa Rizki", "Eka Pramesti", "Farhan Aditya", "Gita Maharani", "Hana Safira", "Iqbal Ramadhan", "Jihan Aulia", "Kirana Dewi", "Luthfi Akbar", "Maya Salsabila", "Naufal Azzam", "Ocha Melati", "Putra Bagas", "Qila Zahra", "Raka Saputra", "Sinta Ayu", "Tara Anindya"];
  return names.map((name, index) => {
    const participant: Participant = { code: `sample-${index}`, name, className: index < 9 ? "V" : "VI", pretest: null, posttest: null };
    if (index > 13) return participant;
    const pretest: Attempt = { answers: questions.pretest.map((question, questionIndex) => questionIndex < 4 + index % 4 ? question.correct : (question.correct + 1) % 4), submittedAt: "2026-10-13T01:30:00.000Z" };
    const posttest: Attempt | null = index < 10 ? { answers: questions.posttest.map((question, questionIndex) => questionIndex < 8 + index % 3 ? question.correct : (question.correct + 1) % 4), submittedAt: "2026-10-13T02:30:00.000Z" } : null;
    return { ...participant, pretest, posttest };
  });
}

export const explanations: Record<TestKind, string[]> = {
  pretest: [
    "AI adalah singkatan dari Artificial Intelligence, atau kecerdasan buatan.",
    "AI membantu komputer mengenali pola dan memahami informasi. Manusia tetap perlu berpikir.",
    "Google Maps menggunakan teknologi AI, misalnya untuk membantu memperkirakan lalu lintas dan perjalanan.",
    "AI belajar mengenali pola dari banyak contoh atau data.",
    "AI dapat mengenali pola dalam suara, gambar, dan tulisan.",
    "AI bisa membuat kesalahan. Jawabannya perlu diperiksa kembali.",
    "Periksa jawaban AI dengan buku, sumber tepercaya, atau bantuan guru.",
    "Password adalah data pribadi. Jangan memberikannya kepada AI atau orang lain.",
    "Gunakan AI sebagai alat bantu. Kita tetap perlu belajar dan berpikir sendiri.",
    "Jawaban yang terdengar meyakinkan belum tentu benar. Tetap periksa kebenarannya.",
  ],
  posttest: [
    "AI dapat membantu memahami informasi dan memberikan jawaban tentang pelajaran.",
    "Banyak contoh membantu AI mengenali pola dengan lebih baik.",
    "Kamera mengenali wajah melalui pola pada gambar.",
    "Rekomendasi video adalah salah satu contoh penggunaan AI di sekitar kita.",
    "Jika AI keliru, periksa lagi informasinya bersama guru atau melalui sumber tepercaya.",
    "Dalam materi ini, AI mengenali pola suara, wajah, dan tulisan. Password harus dijaga.",
    "Kita boleh meminta ide cerita tanpa memberikan data pribadi.",
    "Gunakan AI dengan memeriksa informasi dan menjaga data pribadi.",
    "AI membantu manusia, tetapi manusia tetap perlu berpikir dan mengambil keputusan.",
    "AI adalah alat bantu. Tetap berpikir sendiri dan periksa informasi yang diberikan.",
  ],
};
