// Uji alur API terhadap `npm run dev`. Hanya untuk kegiatan uji (PRODAMAT_ACTIVITY_ID diawali "uji"); datanya dihapus di akhir.
// Jalankan: npm run test:api
import assert from "node:assert/strict";
import pg from "pg";

const BASE = process.env.API_BASE ?? "http://localhost:3000";
const ACTIVITY = process.env.PRODAMAT_ACTIVITY_ID ?? "";
if (!ACTIVITY.startsWith("uji")) throw new Error("PRODAMAT_ACTIVITY_ID harus diawali 'uji' agar data kegiatan asli tidak tersentuh.");

function client() {
  const jar = new Map();
  return async (path, { method = "GET", body, origin = BASE } = {}) => {
    const headers = { cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") };
    if (origin) headers.origin = origin;
    if (body !== undefined) headers["content-type"] = "application/json";
    const response = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const line of response.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(";");
      const [key, ...rest] = pair.split("=");
      if (attrs.some(attr => /max-age=0|expires=thu, 01 jan 1970/i.test(attr.trim()))) jar.delete(key.trim()); else jar.set(key.trim(), rest.join("="));
    }
    return { status: response.status, data: await response.json().catch(() => null) };
  };
}

async function clearActivity() {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
  await db.connect();
  await db.query("delete from activity where id = $1", [ACTIVITY]);
  await db.query("delete from login_failure where at > now() - interval '1 hour' and ip in ('::1', '127.0.0.1', 'unknown', '::ffff:127.0.0.1')");
  await db.end();
}
await clearActivity();

const results = [];
async function step(name, run) {
  try { await run(); results.push(`PASS  ${name}`); }
  catch (error) { results.push(`FAIL  ${name}: ${error.message}`); process.exitCode = 1; }
}

const pendamping = client(), siswa = client(), siswaLain = client(), siswaUlang = client();
let key = { pretest: [], posttest: [] };

await step("pendamping tanpa sesi ditolak (401)", async () => assert.equal((await pendamping("/api/pendamping/rekap")).status, 401));
await step("kata sandi salah ditolak (401)", async () => assert.equal((await pendamping("/api/pendamping/masuk", { method: "POST", body: { password: "salah" } })).status, 401));
await step("pendamping masuk", async () => assert.equal((await pendamping("/api/pendamping/masuk", { method: "POST", body: { password: process.env.PENDAMPING_PASSWORD } })).status, 200));
await step("fase diatur ke pretest", async () => assert.equal((await pendamping("/api/pendamping/fase", { method: "PATCH", body: { phase: "pretest" } })).data.phase, "pretest"));
await step("rekap memuat kunci untuk pendamping", async () => {
  const { data } = await pendamping("/api/pendamping/rekap");
  key = { pretest: data.questions.pretest.map(q => q.correct), posttest: data.questions.posttest.map(q => q.correct) };
  assert.equal(key.pretest.length, 10);
});
await step("permintaan tanpa Origin ditolak (403)", async () => assert.equal((await siswa("/api/peserta", { method: "POST", body: { name: "Uji Satu", className: "V" }, origin: null })).status, 403));
await step("nama tidak valid ditolak (400)", async () => assert.equal((await siswa("/api/peserta", { method: "POST", body: { name: "1", className: "V" } })).status, 400));
await step("siswa mendaftar", async () => {
  const { status, data } = await siswa("/api/peserta", { method: "POST", body: { name: "  Uji   Satu ", className: "V" } });
  assert.equal(status, 200); assert.equal(data.participant.name, "Uji Satu"); assert.equal(data.phase, "pretest");
});
await step("soal untuk siswa tanpa kunci jawaban", async () => {
  const { data } = await siswa("/api/soal");
  assert.equal(data.pretest.length, 10);
  assert.ok(!JSON.stringify(data).includes("correct"));
});
await step("posttest belum bisa dijawab (409)", async () => assert.equal((await siswa("/api/jawaban", { method: "PUT", body: { kind: "posttest", index: 0, answer: 1 } })).status, 409));
await step("indeks jawaban di luar batas ditolak (400)", async () => assert.equal((await siswa("/api/jawaban", { method: "PUT", body: { kind: "pretest", index: 10, answer: 1 } })).status, 400));
await step("kirim sebelum lengkap ditolak (409)", async () => {
  await siswa("/api/jawaban", { method: "PUT", body: { kind: "pretest", index: 0, answer: 0 } });
  assert.equal((await siswa("/api/kirim", { method: "POST", body: { kind: "pretest" } })).status, 409);
});
await step("10 jawaban pretest tersimpan (6 benar)", async () => {
  for (let index = 0; index < 10; index++) {
    const answer = index < 6 ? key.pretest[index] : (key.pretest[index] + 1) % 4;
    const { status, data } = await siswa("/api/jawaban", { method: "PUT", body: { kind: "pretest", index, answer } });
    assert.equal(status, 200); assert.equal(data.answers[index], answer);
  }
});
await step("nama dan kelas sama melanjutkan peserta yang sama", async () => {
  const { data } = await siswaUlang("/api/peserta", { method: "POST", body: { name: "uji satu", className: "V" } });
  assert.equal(data.participant.pretest.answers.filter(a => a !== null).length, 10);
});
await step("nama sama kelas berbeda jadi peserta terpisah", async () => {
  const { data } = await siswaLain("/api/peserta", { method: "POST", body: { name: "Uji Satu", className: "VI" } });
  assert.equal(data.participant.pretest, null);
});
await step("kirim ganda bersamaan hanya tercatat sekali", async () => {
  const sends = await Promise.all([1, 2, 3].map(() => siswa("/api/kirim", { method: "POST", body: { kind: "pretest" } })));
  assert.ok(sends.every(send => send.status === 200));
  const { data } = await pendamping("/api/pendamping/rekap");
  const row = data.participants.find(p => p.name === "Uji Satu" && p.className === "V");
  assert.equal(row.scores.pretest, 6);
});
await step("jawaban terkirim tidak bisa diubah (409)", async () => assert.equal((await siswa("/api/jawaban", { method: "PUT", body: { kind: "pretest", index: 0, answer: 3 } })).status, 409));
await step("hasil belum tersedia sebelum posttest (403)", async () => assert.equal((await siswa("/api/hasil")).status, 403));
await step("rekap pendamping tidak bisa dibuka siswa (401)", async () => assert.equal((await siswa("/api/pendamping/rekap")).status, 401));
await step("siswa tidak bisa mengubah fase (401)", async () => assert.equal((await siswa("/api/pendamping/fase", { method: "PATCH", body: { phase: "posttest" } })).status, 401));
await step("fase posttest terlihat oleh siswa", async () => {
  await pendamping("/api/pendamping/fase", { method: "PATCH", body: { phase: "posttest" } });
  assert.equal((await siswa("/api/peserta/saya")).data.phase, "posttest");
});
await step("posttest butuh pretest terkirim (409)", async () => assert.equal((await siswaLain("/api/jawaban", { method: "PUT", body: { kind: "posttest", index: 0, answer: 1 } })).status, 409));
await step("posttest dikirim (9 benar) dan hasil lengkap", async () => {
  for (let index = 0; index < 10; index++) await siswa("/api/jawaban", { method: "PUT", body: { kind: "posttest", index, answer: index < 9 ? key.posttest[index] : (key.posttest[index] + 1) % 4 } });
  assert.equal((await siswa("/api/kirim", { method: "POST", body: { kind: "posttest" } })).status, 200);
  const { status, data } = await siswa("/api/hasil");
  assert.equal(status, 200); assert.equal(data.pretest.score, 6); assert.equal(data.posttest.score, 9); assert.equal(data.posttest.explanations.length, 10);
});
await step("data contoh tidak menyentuh data kegiatan", async () => {
  const { data } = await pendamping("/api/pendamping/rekap?contoh=1");
  assert.equal(data.sample, true); assert.equal(data.participants.length, 20);
  assert.equal((await pendamping("/api/pendamping/rekap")).data.participants.length, 2);
});
await step("ganti peserta mengakhiri sesi", async () => {
  assert.equal((await siswa("/api/peserta/saya", { method: "DELETE" })).status, 200);
  assert.equal((await siswa("/api/peserta/saya")).data.participant, null);
  assert.equal((await siswa("/api/soal")).status, 401);
});
const findRow = async (name, className) => (await pendamping("/api/pendamping/rekap")).data.participants.find(p => p.name === name && p.className === className);
await step("siswa tidak bisa mengubah data siswa (401)", async () => assert.equal((await siswaUlang("/api/pendamping/peserta", { method: "PATCH", body: { id: "00000000-0000-0000-0000-000000000000", name: "X Y", className: "V" } })).status, 401));
await step("pendamping membetulkan nama, jawaban tetap tersambung", async () => {
  const row = await findRow("Uji Satu", "V");
  assert.equal((await pendamping("/api/pendamping/peserta", { method: "PATCH", body: { id: row.code, name: "Uji Satu Benar", className: "V" } })).status, 200);
  const renamed = await findRow("Uji Satu Benar", "V");
  assert.equal(renamed.scores.posttest, 9);
  assert.equal((await siswaUlang("/api/peserta/saya")).data.participant.name, "Uji Satu Benar");
});
await step("nama bentrok di kelas yang sama ditolak (409)", async () => {
  const other = await findRow("Uji Satu", "VI");
  assert.equal((await pendamping("/api/pendamping/peserta", { method: "PATCH", body: { id: other.code, name: "uji satu benar", className: "V" } })).status, 409);
});
await step("pendamping menghapus satu siswa", async () => {
  const other = await findRow("Uji Satu", "VI");
  assert.equal((await pendamping("/api/pendamping/peserta", { method: "DELETE", body: { id: other.code } })).status, 200);
  assert.equal(await findRow("Uji Satu", "VI"), undefined);
  assert.equal((await siswaLain("/api/peserta/saya")).data.participant, null);
});
await step("reset tanpa kalimat konfirmasi ditolak (400)", async () => assert.equal((await pendamping("/api/pendamping/reset", { method: "POST", body: { confirm: "ya" } })).status, 400));
await step("reset mengosongkan siswa dan kembali ke pretest", async () => {
  await pendamping("/api/pendamping/fase", { method: "PATCH", body: { phase: "closed" } });
  assert.equal((await pendamping("/api/pendamping/reset", { method: "POST", body: { confirm: "mulai baru" } })).status, 200);
  const { data } = await pendamping("/api/pendamping/rekap");
  assert.equal(data.participants.length, 0); assert.equal(data.phase, "pretest");
  assert.equal((await siswaUlang("/api/peserta/saya")).data.participant, null);
});
await step("pendamping keluar", async () => {
  await pendamping("/api/pendamping/keluar", { method: "POST" });
  assert.equal((await pendamping("/api/pendamping/rekap")).status, 401);
});

await clearActivity();
console.log(results.join("\n"));
console.log(`\n${results.filter(line => line.startsWith("PASS")).length}/${results.length} lulus. Data kegiatan "${ACTIVITY}" sudah dihapus.`);
