import type { Question, RekapParticipant, TestKind } from "./model";
import { awards, ranking } from "./model";
import { team } from "./team";

// Rekap Excel berformat untuk laporan. exceljs dimuat hanya saat tombol unduh ditekan agar dashboard tetap ringan.
const BLUE = "FF2244BD", BLUE_WASH = "FFEEF2FF", INK = "FF1F2D44", MUTED = "FF4D5B6E", GREEN_WASH = "FFE6F4EC", GREEN = "FF1D6B44", SUN_WASH = "FFFFF4D6", SUN_INK = "FF6B4A00", LINE = "FFE2E4E8", ZEBRA = "FFF7F8FA";
const letter = (answer: number | null | undefined) => answer === null || answer === undefined ? "" : String.fromCharCode(65 + answer);
// Excel menyimpan tanggal tanpa zona waktu; geser ke waktu lokal agar 08.30 WIB tidak tampil 01.30.
const local = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000);
const when = (iso: string | null | undefined) => iso ? local(new Date(iso)) : null;
const classLabel = (className: string) => className === "V" ? "5" : "6";

export async function exportExcel({ participants, questions, sample }: { participants: RekapParticipant[]; questions: Record<TestKind, Question[]>; sample: boolean }) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.creator = `PRODAMAT 2026 ${team.group}`;
  book.created = new Date();
  const ranks = ranking(participants);
  const rankOf = (code: string) => ranks.find(item => item.participant.code === code)?.rank ?? null;
  const ordered = [...participants].sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name, "id-ID"));
  const codeOf = new Map(ordered.map((item, index) => [item.code, `P${String(index + 1).padStart(3, "0")}`]));
  const paired = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null);
  const avg = (kind: TestKind) => paired.length ? paired.reduce((total, item) => total + item.scores[kind]!, 0) / paired.length : null;

  const header = (row: { eachCell: (fn: (cell: import("exceljs").Cell) => void) => void; height?: number }) => {
    row.height = 30;
    row.eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = { bottom: { style: "thin", color: { argb: BLUE } } };
    });
  };
  const banner = (sheet: import("exceljs").Worksheet, title: string, span: number) => {
    sheet.mergeCells(1, 1, 1, span);
    const top = sheet.getCell(1, 1);
    top.value = title;
    top.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    top.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    top.alignment = { vertical: "middle", indent: 1 };
    sheet.getRow(1).height = 34;
    sheet.mergeCells(2, 1, 2, span);
    const sub = sheet.getCell(2, 1);
    sub.value = `${sample ? "DATA CONTOH · " : ""}${team.program} · SDN Karangsari Yogyakarta · 13 Oktober 2026`;
    sub.font = { italic: true, color: { argb: MUTED } };
    sub.alignment = { indent: 1, wrapText: true };
    sheet.getRow(2).height = 30;
  };
  const zebra = (sheet: import("exceljs").Worksheet, from: number) => {
    for (let index = from; index <= sheet.rowCount; index++) {
      sheet.getRow(index).eachCell({ includeEmpty: true }, cell => {
        if (index % 2 === 0 && !(cell.fill as { fgColor?: unknown } | undefined)?.fgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
        cell.border = { bottom: { style: "hair", color: { argb: LINE } } };
        cell.alignment = { vertical: "middle", ...cell.alignment };
      });
    }
  };

  // 1. Ringkasan
  const summary = book.addWorksheet("Ringkasan", { properties: { tabColor: { argb: BLUE } }, views: [{ showGridLines: false }] });
  summary.columns = [{ width: 34 }, { width: 22 }, { width: 22 }, { width: 22 }];
  banner(summary, `Rekap PRODAMAT 2026 · ${team.group}`, 4);
  const changes = { naik: 0, tetap: 0, turun: 0 };
  for (const item of paired) { const diff = item.scores.posttest! - item.scores.pretest!; changes[diff > 0 ? "naik" : diff < 0 ? "turun" : "tetap"]++; }
  const facts: [string, string | number | Date][] = [
    ["Siswa terdaftar", participants.length],
    ["Kelas 5 / Kelas 6", `${participants.filter(item => item.className === "V").length} / ${participants.filter(item => item.className === "VI").length}`],
    ["Mengirim tes awal (pretest)", participants.filter(item => item.scores.pretest !== null).length],
    ["Mengirim tes akhir (posttest)", participants.filter(item => item.scores.posttest !== null).length],
    ["Pasangan tes lengkap", paired.length],
    ["Rata-rata tes awal (pasangan lengkap)", avg("pretest") === null ? "-" : Number(avg("pretest")!.toFixed(2))],
    ["Rata-rata tes akhir (pasangan lengkap)", avg("posttest") === null ? "-" : Number(avg("posttest")!.toFixed(2))],
    ["Siswa naik / tetap / turun", `${changes.naik} / ${changes.tetap} / ${changes.turun}`],
    ["Diunduh pada", local(new Date())],
  ];
  summary.addRow([]);
  const factStart = summary.rowCount + 1;
  for (const [label, value] of facts) summary.addRow([label, value]);
  for (let index = factStart; index <= summary.rowCount; index++) {
    const row = summary.getRow(index);
    row.height = 22;
    row.getCell(1).font = { color: { argb: MUTED } };
    row.getCell(2).font = { bold: true, size: 12, color: { argb: INK } };
    row.getCell(2).alignment = { horizontal: "left" };
    if (index % 2 === 0) [1, 2].forEach(column => { row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_WASH } }; });
  }
  summary.getCell(summary.rowCount, 2).numFmt = "dd/mm/yyyy hh:mm";
  summary.addRow([]);
  // Pemenang apresiasi, aturan sama dengan tab Peringkat (lib/model.ts awards).
  summary.addRow(["Pemenang apresiasi"]).getCell(1).font = { bold: true, size: 12, color: { argb: BLUE } };
  for (const award of awards(participants, questions.posttest)) {
    const detail = award.empty ?? `${award.winners.map(entry => `${entry.participant.name} (${codeOf.get(entry.participant.code)}, kelas ${entry.participant.className})`).join(", ")} · ${award.key === "improvement" ? `naik ${award.winners[0].gain} poin` : `posttest ${award.winners[0].post}/10`}${award.winners.length > 1 ? " · masih seri" : ""}`;
    summary.addRow([award.title, detail]);
  }
  summary.addRow([]);
  summary.addRow(["Tim pelaksana"]).getCell(1).font = { bold: true, size: 12, color: { argb: BLUE } };
  summary.addRow(["Ketua kelompok", `${team.leader.name} (${team.leader.nim})`]);
  team.members.forEach((member, index) => summary.addRow([index ? "" : "Anggota", `${member.name} (${member.nim})`]));
  team.advisors.forEach((advisor, index) => summary.addRow([index ? "" : "Dosen pembimbing", advisor]));
  summary.addRow([]);
  const note = summary.addRow(["Catatan: soal tes awal dan tes akhir berbeda; selisih nilai bersifat deskriptif. Gunakan kode peserta (P001, ...) di laporan agar nama anak tidak dipublikasikan."]);
  summary.mergeCells(note.number, 1, note.number, 4);
  note.getCell(1).font = { italic: true, color: { argb: MUTED } };
  note.getCell(1).alignment = { wrapText: true };
  note.height = 34;

  // 2. Peserta
  const people = book.addWorksheet("Peserta", { properties: { tabColor: { argb: "FF6F8AE6" } }, views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  people.columns = [{ width: 9 }, { width: 30 }, { width: 8 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 18 }, { width: 11 }, { width: 18 }, { width: 18 }];
  banner(people, "Daftar peserta dan nilai", 10);
  header(people.addRow(["Kode", "Nama peserta", "Kelas", "Nilai awal", "Nilai akhir", "Perubahan", "Status", "Peringkat", "Kirim tes awal", "Kirim tes akhir"]));
  for (const item of ordered) {
    const pre = item.scores.pretest, post = item.scores.posttest;
    const row = people.addRow([codeOf.get(item.code), item.name, classLabel(item.className), pre ?? "", post ?? "", pre !== null && post !== null ? post - pre : "", post !== null ? "Kedua tes selesai" : pre !== null ? "Tes awal selesai" : "Belum selesai", rankOf(item.code) ?? "", when(item.pretest?.submittedAt), when(item.posttest?.submittedAt)]);
    [3, 4, 5, 6, 8].forEach(column => { row.getCell(column).alignment = { horizontal: "center" }; });
    [9, 10].forEach(column => { row.getCell(column).numFmt = "dd/mm/yyyy hh:mm"; });
    const change = row.getCell(6);
    if (typeof change.value === "number") {
      change.numFmt = "+0;-0;0";
      change.font = { bold: true, color: { argb: change.value > 0 ? GREEN : change.value < 0 ? SUN_INK : MUTED } };
      change.fill = { type: "pattern", pattern: "solid", fgColor: { argb: change.value > 0 ? GREEN_WASH : change.value < 0 ? SUN_WASH : ZEBRA } };
    }
    const status = row.getCell(7);
    status.font = { color: { argb: post !== null ? GREEN : pre !== null ? BLUE : MUTED }, bold: post !== null };
  }
  zebra(people, 4);
  people.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 10 } };

  // 3. Jawaban per butir, hijau = tepat
  const answers = book.addWorksheet("Jawaban", { properties: { tabColor: { argb: "FF237A4E" } }, views: [{ state: "frozen", xSplit: 3, ySplit: 4, showGridLines: false }] });
  answers.columns = [{ width: 9 }, { width: 28 }, { width: 7 }, ...Array.from({ length: 20 }, () => ({ width: 6 }))];
  banner(answers, "Jawaban per soal (hijau = tepat)", 23);
  header(answers.addRow(["Kode", "Nama", "Kelas", ...Array.from({ length: 10 }, (_, index) => `A${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `B${index + 1}`)]));
  const key = answers.addRow(["KUNCI", "Kunci jawaban", "", ...questions.pretest.map(question => letter(question.correct)), ...questions.posttest.map(question => letter(question.correct))]);
  key.eachCell(cell => { cell.font = { bold: true, color: { argb: BLUE } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_WASH } }; cell.alignment = { horizontal: "center" }; });
  for (const item of ordered) {
    const row = answers.addRow([codeOf.get(item.code), item.name, classLabel(item.className), ...(["pretest", "posttest"] as TestKind[]).flatMap(kind => questions[kind].map((_, index) => letter(item[kind]?.answers[index])))]);
    (["pretest", "posttest"] as TestKind[]).forEach((kind, part) => questions[kind].forEach((question, index) => {
      const cell = row.getCell(4 + part * 10 + index);
      cell.alignment = { horizontal: "center" };
      const given = item[kind]?.answers[index];
      if (given === null || given === undefined) return;
      const right = given === question.correct;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: right ? GREEN_WASH : "FFF3F4F6" } };
      cell.font = { color: { argb: right ? GREEN : MUTED }, bold: right };
    }));
    row.getCell(3).alignment = { horizontal: "center" };
  }
  answers.getRow(3).getCell(4).note = "A = tes awal (pretest), B = tes akhir (posttest)";

  // 4. Analisis soal dengan bilah data dan sebaran pilihan
  const analysis = book.addWorksheet("Analisis soal", { properties: { tabColor: { argb: "FFFFC94D" } }, views: [{ state: "frozen", ySplit: 3, showGridLines: false }] });
  analysis.columns = [{ width: 11 }, { width: 6 }, { width: 62 }, { width: 8 }, { width: 10 }, { width: 11 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }];
  banner(analysis, "Analisis per soal", 10);
  header(analysis.addRow(["Tes", "No", "Soal", "Kunci", "Pengirim", "% benar", "A", "B", "C", "D"]));
  const startRow = analysis.rowCount + 1;
  for (const kind of ["pretest", "posttest"] as TestKind[]) {
    const done = participants.filter(item => item[kind]?.submittedAt);
    questions[kind].forEach((question, index) => {
      const counts = [0, 1, 2, 3].map(option => done.filter(item => item[kind]!.answers[index] === option).length);
      const row = analysis.addRow([kind === "pretest" ? "Tes awal" : "Tes akhir", index + 1, question.text, letter(question.correct), done.length, done.length ? counts[question.correct] / done.length : null, ...counts]);
      row.getCell(3).alignment = { wrapText: true, vertical: "middle" };
      row.getCell(6).numFmt = "0%";
      [2, 4, 5, 6, 7, 8, 9, 10].forEach(column => { row.getCell(column).alignment = { horizontal: "center", vertical: "middle" }; });
      row.getCell(7 + question.correct).font = { bold: true, color: { argb: GREEN } };
      row.getCell(7 + question.correct).fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN_WASH } };
    });
  }
  zebra(analysis, startRow);
  analysis.addConditionalFormatting({ ref: `F${startRow}:F${analysis.rowCount}`, rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }], color: { argb: "FF6F8AE6" } } as never] });

  const buffer = await book.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
