import "server-only";
import questionData from "../questions.json";
import type { PublicQuestion, Question, RekapParticipant, TestKind } from "../model";

export const questions: Record<TestKind, Question[]> = questionData;
export const answerKey = (kind: TestKind) => questions[kind].map(question => question.correct);

export function publicQuestions(): Record<TestKind, PublicQuestion[]> {
  const strip = (kind: TestKind) => questions[kind].map(({ id, text, options }) => ({ id, text, options }));
  return { pretest: strip("pretest"), posttest: strip("posttest") };
}

export const validAnswer = (kind: TestKind, index: number, answer: number) =>
  Number.isInteger(index) && index >= 0 && index < questions[kind].length &&
  Number.isInteger(answer) && answer >= 0 && answer < questions[kind][index].options.length;

export const scoreAnswers = (kind: TestKind, answers: (number | null)[]) =>
  questions[kind].reduce((total, question, index) => total + Number(answers[index] === question.correct), 0);

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

// Data simulasi untuk tombol "Lihat data contoh" di dashboard; tidak pernah ditulis ke database.
export function sampleParticipants(): RekapParticipant[] {
  const names = ["Alya Putri", "Bima Pratama", "Citra Lestari", "Daffa Rizki", "Eka Pramesti", "Farhan Aditya", "Gita Maharani", "Hana Safira", "Iqbal Ramadhan", "Jihan Aulia", "Kirana Dewi", "Luthfi Akbar", "Maya Salsabila", "Naufal Azzam", "Ocha Melati", "Putra Bagas", "Qila Zahra", "Raka Saputra", "Sinta Ayu", "Tara Anindya"];
  return names.map((name, index) => {
    const base: RekapParticipant = { code: `sample-${index}`, name, className: index < 9 ? "V" : "VI", pretest: null, posttest: null, scores: { pretest: null, posttest: null } };
    if (index > 13) return base;
    const pretest = { answers: questions.pretest.map((question, questionIndex) => questionIndex < 4 + index % 4 ? question.correct : (question.correct + 1) % 4), submittedAt: "2026-10-13T01:30:00.000Z" };
    const posttest = index < 10 ? { answers: questions.posttest.map((question, questionIndex) => questionIndex < 8 + index % 3 ? question.correct : (question.correct + 1) % 4), submittedAt: "2026-10-13T02:30:00.000Z" } : null;
    return { ...base, pretest, posttest, scores: { pretest: scoreAnswers("pretest", pretest.answers), posttest: posttest ? scoreAnswers("posttest", posttest.answers) : null } };
  });
}
