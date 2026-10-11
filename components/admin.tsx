"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Check, KeyRound, LogOut, Pencil, RotateCcw, Search, Star, Timer, Trash2, Trophy } from "lucide-react";
import { awards, csvCell, formatDuration, isClassName, phaseLabels, ranking, type Award, type AwardCriterion, type Prize, RESET_PHRASE, validName, type ClassName, type Phase, type Rekap, type RekapParticipant, type TestKind } from "@/lib/model";
import { Dialog } from "./dialog";
import { team } from "@/lib/team";
import { Analytics } from "./analytics";
import { Certificates } from "./certificates";
import { downloadBlob } from "@/lib/certificate";
import { api, errorMessage, errorStatus } from "@/lib/api";
import { StateMessage } from "./state-message";

const phaseOptions: { value: Phase; label: string; description: string }[] = [
  { value: "pretest", label: "Pretest", description: "Sebelum materi" },
  { value: "learning", label: "Belajar", description: "Materi & permainan" },
  { value: "posttest", label: "Posttest", description: "Setelah materi" },
  { value: "closed", label: "Selesai", description: "Tutup sesi" },
];
const phaseEffects: Record<Phase, string> = {
  pretest: "Siswa bisa mengerjakan pretest. Posttest tetap tertutup.",
  learning: "Pretest ditutup. Siswa melihat langkah Jadi Detektif AI dan menunggu posttest.",
  posttest: "Pretest ditutup dan posttest dibuka untuk siswa yang sudah mengirim pretest.",
  closed: "Semua tes ditutup. Siswa yang sudah menyelesaikan kedua tes tetap bisa melihat hasilnya.",
};
const phaseActions: Record<Phase, string> = { pretest: "Ya, buka pretest", learning: "Ya, mulai waktu belajar", posttest: "Ya, buka posttest", closed: "Ya, tutup sesi" };
const format = (value: number | null) => value === null ? "Belum ada" : value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
const REFRESH_MS = 10000;

export function AdminApp() {
  const [rekap, setRekap] = useState<Rekap | null>(null);
  const [status, setStatus] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [sample, setSample] = useState(false);
  const [phaseSaving, setPhaseSaving] = useState(false);

  const load = useCallback(async (useSample: boolean) => {
    try {
      setRekap(await api<Rekap>(`/api/pendamping/rekap${useSample ? "?contoh=1" : ""}`));
      setStatus("ready"); setError("");
    } catch (failure) {
      if (errorStatus(failure) === 401) { setStatus("login"); setRekap(null); return; }
      setError(errorMessage(failure));
      setStatus(current => current === "ready" ? "ready" : "error");
    }
  }, []);

  useEffect(() => { void load(sample); }, [load, sample]);
  useEffect(() => {
    if (status !== "ready") return;
    const tick = () => { if (document.visibilityState === "visible") void load(sample); };
    const timer = window.setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load, sample, status]);

  async function changePhase(phase: Phase) {
    setPhaseSaving(true);
    try { await api("/api/pendamping/fase", { method: "PATCH", body: { phase } }); await load(sample); }
    catch (failure) { if (errorStatus(failure) === 401) setStatus("login"); else setError(errorMessage(failure)); }
    finally { setPhaseSaving(false); }
  }
  async function toggleAiko3d(enabled: boolean) {
    try { await api("/api/pendamping/aiko3d", { method: "PATCH", body: { enabled } }); await load(sample); }
    catch (failure) { if (errorStatus(failure) === 401) setStatus("login"); else setError(errorMessage(failure)); }
  }
  async function savePrize(change: Partial<Prize>) {
    try { await api("/api/pendamping/apresiasi", { method: "PATCH", body: change }); await load(sample); }
    catch (failure) { if (errorStatus(failure) === 401) setStatus("login"); else setError(errorMessage(failure)); }
  }
  async function logout() {
    try { await api("/api/pendamping/keluar", { method: "POST" }); } catch {}
    setRekap(null); setSample(false); setStatus("login");
  }

  if (status === "login") return <AdminLogin onDone={() => { setStatus("loading"); void load(sample); }}/>;
  if (status === "loading" || !rekap) return status === "error" ? <StateMessage title="Data kegiatan belum bisa dimuat." detail={error} onRetry={() => load(sample)}/> : <StateMessage title="Memuat data kegiatan..."/>;
  return <Admin rekap={rekap} sample={sample} onSample={() => setSample(!sample)} onPhase={changePhase} phaseSaving={phaseSaving} onLogout={logout} onRefresh={() => load(sample)} onAiko3d={toggleAiko3d} onPrize={savePrize} error={error}/>;
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  return <section className="student-layout login-layout content-width">
    <div className="login-main">
      <p className="kicker">Ruang pendamping</p>
      <h1 className="join-title">Masuk sebagai pendamping</h1>
      <form className="panel join-panel login-panel" onSubmit={async event => {
        event.preventDefault(); if (sending || !password) return;
        setSending(true); setError("");
        try { await api("/api/pendamping/masuk", { method: "POST", body: { password } }); setPassword(""); onDone(); }
        catch (failure) { setError(errorMessage(failure)); }
        finally { setSending(false); }
      }}>
        <label className="field-label" htmlFor="pendamping-password"><KeyRound size={20} aria-hidden="true"/>Kata sandi pendamping</label>
        <input id="pendamping-password" className="name-input" type="password" autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined}/>
        {error ? <p id="login-error" className="field-error" role="alert">{error}</p> : <p className="field-hint">Halaman ini hanya untuk kakak pendamping. Siswa masuk dari Beranda.</p>}
        <button className="button primary full-width big" type="submit" disabled={!password || sending}>{sending ? "Memeriksa..." : "Masuk"}</button>
      </form>
      <div className="login-checklist">
        <h2>Sebelum anak datang</h2>
        <ol>
          <li><strong>Semua pendamping masuk dulu.</strong> Sesi berlaku 12 jam, jadi tidak perlu masuk lagi saat kegiatan.</li>
          <li><strong>Satu orang saja yang menekan tombol tahap.</strong> Pendamping lain cukup memantau.</li>
          <li><strong>Unduh rekap Excel</strong> setiap kali pretest atau posttest ditutup.</li>
        </ol>
      </div>
    </div>
    <aside className="panel team-card" aria-labelledby="team-title">
      <p className="kicker">PRODAMAT 2026</p>
      <h2 id="team-title">{team.group}</h2>
      <p className="team-program">{team.program}</p>
      <dl className="team-list">
        <div><dt>Ketua kelompok</dt><dd><span className="team-name">{team.leader.name}</span><span className="team-meta">{team.leader.nim} · {team.study}</span></dd></div>
        <div><dt>Anggota</dt><dd><ol>{team.members.map(member => <li key={member.nim}><span className="team-name">{member.name}</span><span className="team-meta">{member.nim} · {team.study}</span></li>)}</ol></dd></div>
        <div><dt>Dosen pembimbing</dt><dd><ol>{team.advisors.map(advisor => <li key={advisor}><span className="team-name">{advisor}</span></li>)}</ol></dd></div>
      </dl>
      <p className="team-foot">Fakultas Teknologi Industri · Universitas Ahmad Dahlan</p>
    </aside>
  </section>;
}

function Admin({ rekap, sample, onSample, onPhase, phaseSaving, onLogout, onRefresh, onAiko3d, onPrize, error }: { rekap: Rekap; onPrize: (change: Partial<Prize>) => Promise<void>; sample: boolean; onSample: () => void; onPhase: (phase: Phase) => Promise<void>; phaseSaving: boolean; onLogout: () => void; onRefresh: () => Promise<void>; onAiko3d: (enabled: boolean) => Promise<void>; error: string }) {
  const [pendingPhase, setPendingPhase] = useState<Phase | null>(null);
  const [editing, setEditing] = useState<RekapParticipant | null>(null);
  const [resetting, setResetting] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [tab, setTab] = useState<"participants" | "analytics" | "ranking" | "questions" | "certificates">("participants");
  const [exporting, setExporting] = useState(false);
  const [testFilter, setTestFilter] = useState<TestKind>("pretest");
  const { phase, questions, participants: data } = rekap;
  const preDone = data.filter(participant => participant.scores.pretest !== null);
  const paired = data.filter(participant => participant.scores.pretest !== null && participant.scores.posttest !== null);
  const average = (kind: TestKind) => paired.length ? paired.reduce((total, participant) => total + (participant.scores[kind] ?? 0), 0) / paired.length : null;
  const preAverage = average("pretest"), postAverage = average("posttest");
  const matches = (participant: RekapParticipant) => participant.name.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")) && (classFilter === "all" || participant.className === classFilter);
  const visible = data.filter(matches);
  const ranks = ranking(data);
  const prizes = awards(data, questions.posttest, rekap.prize);
  const visibleRanks = ranks.filter(item => matches(item.participant));
  const completed = data.filter(participant => participant[testFilter]?.submittedAt);

  async function exportXlsx() {
    setExporting(true);
    try {
      const { exportExcel } = await import("@/lib/export-excel");
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(await exportExcel({ participants: data, questions, sample, prize: rekap.prize }), `rekap-prodamat-kelompok2-${sample ? "contoh" : stamp}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    } finally { setExporting(false); }
  }

  function exportCsv() {
    const ordered = [...data].sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name, "id-ID"));
    const rows = [["Sumber data", "Kode", "Nama peserta", "Kelas", "Peringkat total", "Nilai pretest", "Nilai posttest", "Selisih poin", "Status", "Kirim pretest", "Kirim posttest", ...Array.from({ length: 10 }, (_, index) => `Pretest ${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `Posttest ${index + 1}`)], ...ordered.map((participant, order) => {
      const pre = participant.scores.pretest, post = participant.scores.posttest;
      return [sample ? "CONTOH" : "KEGIATAN", `P${String(order + 1).padStart(3, "0")}`, participant.name, participant.className, ranks.find(item => item.participant.code === participant.code)?.rank ?? "", pre ?? "", post ?? "", pre !== null && post !== null ? post - pre : "", post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai", participant.pretest?.submittedAt ?? "", participant.posttest?.submittedAt ?? "", ...(["pretest", "posttest"] as const).flatMap(kind => participant[kind]?.answers.map(answer => answer === null ? "" : String.fromCharCode(65 + answer)) ?? Array<string>(10).fill(""))];
    })];
    const csv = "﻿" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `rekap-ai-${sample ? "contoh" : "kegiatan"}.csv`;
    anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="admin-layout content-width">
    <div className="admin-heading"><div><span className="section-kicker">Ruang pendamping</span><h1>Pantau kegiatan siswa.</h1><p>SDN Karangsari Yogyakarta · 13 Oktober 2026</p></div><div className="admin-actions"><button className="text-button" aria-pressed={sample} onClick={onSample}>{sample ? "Kembali ke data kegiatan" : "Lihat data contoh"}</button><button className="text-button" onClick={onLogout}><LogOut size={17}/>Keluar</button></div></div>
    <p className="local-notice">Data tersimpan di server kegiatan dan diperbarui otomatis setiap 10 detik.</p>
    {error ? <div className="sample-notice" role="alert"><strong>Pembaruan gagal.</strong> {error} Data di bawah adalah data terakhir yang berhasil dimuat.</div> : null}
    {sample ? <div className="sample-notice" role="status"><strong>Data contoh.</strong> Nama dan jawaban di bawah adalah simulasi. Pengaturan sesi tetap mengatur kegiatan yang sebenarnya.</div> : null}
    <div className="panel session-panel"><div className="panel-title"><div><h2>Atur sesi kegiatan</h2><p>Pilih tahap yang sedang berlangsung.</p></div><span className="status-pill blue" role="status">{phaseSaving ? "Menyimpan..." : phaseLabels[phase]}</span></div><div className="phase-switch">{phaseOptions.map((option, index) => <button key={option.value} className={phase === option.value ? "active" : ""} aria-pressed={phase === option.value} disabled={phaseSaving} onClick={() => { if (option.value !== phase) setPendingPhase(option.value); }}><span className="phase-number">{phase === option.value ? <Check size={18}/> : index + 1}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></button>)}</div><p className="field-hint">Posttest bisa dimulai setelah pretest selesai. Perubahan tahap sampai ke perangkat siswa dalam beberapa detik.</p>
      <label className="aiko3d-switch"><input type="checkbox" role="switch" checked={rekap.aiko3d} onChange={event => void onAiko3d(event.target.checked)}/><span className="switch-track" aria-hidden="true"/><span><strong>Aiko 3D di perangkat siswa {rekap.aiko3d ? "aktif" : "mati"}</strong><small>Matikan bila Chromebook terasa lambat. Siswa kembali melihat Aiko 2D dalam beberapa detik. Layar soal tidak memakai Aiko 3D.</small></span></label></div>
    <dl className="admin-stats"><div><dt>Peserta terdaftar</dt><dd>{data.length}<span>siswa</span></dd><p>{data.filter(item => item.className === "V").length} kelas V · {data.filter(item => item.className === "VI").length} kelas VI</p></div><div><dt>Pretest selesai</dt><dd>{preDone.length}<span>dari {data.length}</span></dd><p>{data.length - preDone.length} belum selesai</p></div><div><dt>Kedua tes selesai</dt><dd>{paired.length}<span>dari {data.length}</span></dd><p>Siap ditampilkan dalam peringkat</p></div></dl>
    <div className="panel roster-panel">
      <div className="roster-top"><div className="admin-tabs" aria-label="Pilih rekap"><button className={tab === "participants" ? "active" : ""} aria-pressed={tab === "participants"} onClick={() => setTab("participants")}>Peserta <span>{data.length}</span></button><button className={tab === "analytics" ? "active" : ""} aria-pressed={tab === "analytics"} onClick={() => setTab("analytics")}>Analitik</button><button className={tab === "ranking" ? "active" : ""} aria-pressed={tab === "ranking"} onClick={() => setTab("ranking")}>Peringkat</button><button className={tab === "questions" ? "active" : ""} aria-pressed={tab === "questions"} onClick={() => setTab("questions")}>Analisis soal</button><button className={tab === "certificates" ? "active" : ""} aria-pressed={tab === "certificates"} onClick={() => setTab("certificates")}>Sertifikat</button></div><div className="export-actions"><button className="button secondary export-button" disabled={exporting} onClick={exportXlsx}><ArrowDownToLine size={17}/>{exporting ? "Menyiapkan Excel..." : "Unduh rekap Excel"}</button><button className="text-button export-csv" onClick={exportCsv}>CSV mentah</button></div></div>
      {tab === "participants" || tab === "ranking" ? <div className="table-controls"><label className="search-field"><Search size={18} aria-hidden="true"/><input type="search" placeholder="Cari nama peserta" aria-label="Cari nama peserta" value={search} onChange={event => setSearch(event.target.value)}/></label><label className="filter-field">Kelas<select aria-label="Filter kelas" value={classFilter} onChange={event => setClassFilter(event.target.value)}><option value="all">Semua kelas</option><option value="V">Kelas V</option><option value="VI">Kelas VI</option></select></label></div> : null}
      {tab === "participants" ? <>
        <div className="table-scroll"><table><caption className="sr-only">Rekap hasil peserta {sample ? "contoh" : "kegiatan"}</caption><thead><tr><th>Nama peserta</th><th>Kelas</th><th>Pretest</th><th>Posttest</th><th>Perubahan</th><th>Status</th>{sample ? null : <th><span className="sr-only">Aksi</span></th>}</tr></thead><tbody>{visible.map(participant => {
          const pre = participant.scores.pretest, post = participant.scores.posttest;
          const progress = (kind: TestKind) => participant[kind] && !participant[kind]!.submittedAt ? `Mengerjakan ${participant[kind]!.answers.filter(answer => answer !== null).length}/10` : "Belum";
          return <tr key={participant.code}><td className="table-name">{participant.name}</td><td>{participant.className}</td><td>{pre === null ? <span className="score-missing">{progress("pretest")}</span> : `${pre}/10`}</td><td>{post === null ? <span className="score-missing">{progress("posttest")}</span> : `${post}/10`}</td><td>{pre !== null && post !== null ? `${post - pre > 0 ? "+" : ""}${post - pre} poin` : <span className="score-missing">Belum lengkap</span>}</td><td><span className={`status-pill ${post !== null ? "green" : pre !== null ? "blue" : "neutral"}`}>{post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai"}</span></td>{sample ? null : <td><button className="button secondary row-action" onClick={() => setEditing(participant)} aria-label={`Ubah data ${participant.name}`}><Pencil size={15}/>Ubah</button></td>}</tr>;
        })}</tbody></table></div>
        {!visible.length ? <Empty title={data.length ? "Tidak ada peserta yang cocok." : "Belum ada peserta terdaftar."} detail={data.length ? "Coba nama lain atau pilih semua kelas." : "Siswa bisa mulai dari Beranda dengan mengisi nama dan kelas."}/> : null}
        <div className="table-footer">Menampilkan {visible.length} dari {data.length} peserta</div>
      </> : tab === "analytics" ? <Analytics participants={data} questions={questions} sample={sample}/> : tab === "certificates" ? <Certificates participants={data} sample={sample}/> : tab === "ranking" ? <>
        <div className="ranking-note"><h2>{phase === "closed" ? "Peringkat hasil belajar" : "Peringkat sementara"}</h2><p>Berdasarkan total nilai pretest + posttest. Total sama berbagi peringkat.</p></div>
        {ranks.length ? <Awards list={prizes} participants={data} prize={rekap.prize} onPrize={onPrize} final={phase === "closed"} sample={sample}/> : <Empty title="Belum ada posttest yang dikirim." detail="Pemenang dan peringkat muncul setelah peserta menyelesaikan kedua tes."/>}
        {ranks.length ? <><div className="table-scroll"><table><caption className="sr-only">Peringkat peserta berdasarkan total pretest dan posttest</caption><thead><tr><th>Peringkat</th><th>Nama peserta</th><th>Kelas</th><th>Total</th><th>Posttest</th><th>Pretest</th></tr></thead><tbody>{visibleRanks.map(({ participant, points, rank }) => <tr key={participant.code}><td><span className={`rank-badge ${rank === 1 ? "first" : ""}`}>{rank}</span></td><td className="table-name">{participant.name}</td><td>{participant.className}</td><td><strong>{points}/20</strong></td><td>{participant.scores.posttest}/10</td><td>{participant.scores.pretest}/10</td></tr>)}</tbody></table></div>{!visibleRanks.length ? <Empty title="Tidak ada peserta yang cocok." detail="Coba nama lain atau pilih semua kelas."/> : null}<div className="table-footer"><span>Menampilkan {visibleRanks.length} dari {ranks.length} peserta selesai</span><span>Peringkat tetap sama saat difilter.</span></div></> : null}
      </> : <div className="analysis-panel">
        <div className="analysis-top"><div><h2>Jawaban per soal</h2><p>{completed.length} tes sudah dikirim.</p></div><div className="segmented-control" aria-label="Pilih tes untuk analisis">{(["pretest", "posttest"] as TestKind[]).map(kind => <button key={kind} aria-pressed={testFilter === kind} className={testFilter === kind ? "active" : ""} onClick={() => setTestFilter(kind)}>{kind === "pretest" ? "Pretest" : "Posttest"}</button>)}</div></div>
        {questions[testFilter].map((question, index) => {
          const correct = completed.filter(participant => participant[testFilter]?.answers[index] === question.correct).length;
          const percent = completed.length ? Math.round(correct / completed.length * 100) : null;
          return <div className="analysis-row" key={question.id}><span className="explanation-number">{question.id}</span><div><strong>{question.text}</strong><p>{correct} dari {completed.length} peserta menjawab benar</p></div><div className="analysis-measure"><div className="analysis-bar"><span style={{ width: `${percent ?? 0}%` }}/></div><span>{percent === null ? "Belum ada" : `${percent}%`}</span></div></div>;
        })}
      </div>}
    </div>
    {sample ? null : <div className="panel danger-zone"><div><h2>Mulai sesi baru</h2><p>Menghapus semua siswa dan jawaban kegiatan ini, lalu kembali ke tahap Pretest. Unduh rekap CSV dulu bila datanya masih diperlukan.</p></div><button className="button danger-outline" onClick={() => setResetting(true)}><RotateCcw size={18}/>Mulai sesi baru</button></div>}
    {pendingPhase ? <PhaseDialog from={phase} to={pendingPhase} participants={data} onCancel={() => setPendingPhase(null)} onConfirm={async () => { await onPhase(pendingPhase); setPendingPhase(null); }}/> : null}
    {editing ? <EditParticipantDialog participant={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await onRefresh(); }}/> : null}
    {resetting ? <ResetDialog total={data.length} onExport={exportCsv} onClose={() => setResetting(false)} onDone={async () => { setResetting(false); await onRefresh(); }}/> : null}
  </section>;
}

function PhaseDialog({ from, to, participants, onCancel, onConfirm }: { from: Phase; to: Phase; participants: RekapParticipant[]; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const working = from === "pretest" || from === "posttest" ? participants.filter(item => item[from] && !item[from]!.submittedAt).length : 0;
  const noPretest = to === "posttest" ? participants.filter(item => !item.pretest?.submittedAt).length : 0;
  return <Dialog title={`Ganti tahap ke ${phaseOptions.find(option => option.value === to)!.label}?`} onClose={onCancel}>
    <p>{phaseEffects[to]} Perubahan sampai ke layar semua siswa dalam beberapa detik.</p>
    {working ? <p className="dialog-warning"><AlertTriangle size={18} aria-hidden="true"/><span>{working} siswa masih mengerjakan {from}. Jawaban yang sudah dipilih tetap tersimpan, tetapi mereka tidak bisa mengirim sampai {from} dibuka lagi.</span></p> : null}
    {noPretest ? <p className="dialog-warning"><AlertTriangle size={18} aria-hidden="true"/><span>{noPretest} siswa belum mengirim pretest, jadi belum bisa mengerjakan posttest.</span></p> : null}
    <div className="modal-actions"><button className="button secondary" onClick={onCancel}>Batal</button><button className="button primary" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}>{busy ? "Menyimpan..." : phaseActions[to]}</button></div>
  </Dialog>;
}

function EditParticipantDialog({ participant, onClose, onSaved }: { participant: RekapParticipant; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(participant.name);
  const [className, setClassName] = useState<ClassName>(participant.className);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const answered = (["pretest", "posttest"] as TestKind[]).filter(kind => participant[kind]?.answers.some(answer => answer !== null));
  async function run(work: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await work(); await onSaved(); } catch (failure) { setError(errorMessage(failure)); setBusy(false); }
  }
  return <Dialog title={confirmDelete ? "Hapus siswa?" : "Ubah data siswa"} onClose={onClose}>
    {confirmDelete ? <>
      <p className="dialog-warning"><AlertTriangle size={18} aria-hidden="true"/><span>Hapus <strong>{participant.name}</strong> (kelas {participant.className === "V" ? "5" : "6"}){answered.length ? ` beserta jawaban ${answered.join(" dan ")}` : ""}? Data ini tidak bisa dikembalikan.</span></p>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="modal-actions"><button className="button secondary" onClick={() => setConfirmDelete(false)}>Batal</button><button className="button danger" disabled={busy} onClick={() => run(() => api("/api/pendamping/peserta", { method: "DELETE", body: { id: participant.code } }))}>{busy ? "Menghapus..." : <><Trash2 size={17}/>Ya, hapus siswa</>}</button></div>
    </> : <form onSubmit={event => { event.preventDefault(); if (!validName(name) || !isClassName(className)) { setError("Nama minimal 2 huruf."); return; } void run(() => api("/api/pendamping/peserta", { method: "PATCH", body: { id: participant.code, name, className } })); }}>
      <p>Siswa tetap tersambung ke jawabannya. Di perangkatnya, nama baru muncul dalam beberapa detik.</p>
      <label className="field-label dialog-label" htmlFor="edit-name">Nama lengkap</label>
      <input id="edit-name" className="name-input" value={name} maxLength={60} autoComplete="off" onChange={event => { setName(event.target.value); setError(""); }}/>
      <fieldset className="class-options compact"><legend className="field-label dialog-label">Kelas</legend>{(["V", "VI"] as ClassName[]).map(value => <label key={value} className={className === value ? "selected" : ""}><input type="radio" name="edit-class" value={value} checked={className === value} onChange={() => setClassName(value)}/><span className="class-number">{value === "V" ? "5" : "6"}</span><span className="class-name">Kelas {value === "V" ? "5" : "6"}</span></label>)}</fieldset>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="modal-actions"><button type="button" className="button danger-outline" onClick={() => { setConfirmDelete(true); setError(""); }}><Trash2 size={17}/>Hapus siswa</button><span className="spacer"/><button type="button" className="button secondary" onClick={onClose}>Batal</button><button type="submit" className="button primary" disabled={busy || !validName(name)}>{busy ? "Menyimpan..." : "Simpan"}</button></div>
    </form>}
  </Dialog>;
}

function ResetDialog({ total, onExport, onClose, onDone }: { total: number; onExport: () => void; onClose: () => void; onDone: () => Promise<void> }) {
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const ready = phrase.trim().toUpperCase() === RESET_PHRASE;
  async function reset() {
    setBusy(true); setError("");
    try { await api("/api/pendamping/reset", { method: "POST", body: { confirm: phrase } }); await onDone(); }
    catch (failure) { setError(errorMessage(failure)); setBusy(false); }
  }
  // Langkah terakhir: pertanyaan "yakin?" setelah kalimat konfirmasi diketik.
  if (sure) return <Dialog title="Apakah kamu yakin?" onClose={onClose}>
    <p className="dialog-warning"><AlertTriangle size={18} aria-hidden="true"/><span>{total ? `Semua data ${total} siswa akan hilang dan tidak bisa dikembalikan.` : "Tahap akan kembali ke Pretest."} Pastikan rekap CSV sudah diunduh bila masih diperlukan.</span></p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="modal-actions"><button className="button secondary" onClick={() => setSure(false)} disabled={busy}>Tidak, kembali</button><button className="button danger" onClick={reset} disabled={busy}>{busy ? "Menghapus..." : "Ya, saya yakin"}</button></div>
  </Dialog>;
  return <Dialog title="Mulai sesi baru?" onClose={onClose}>
    <p className="dialog-warning"><AlertTriangle size={18} aria-hidden="true"/><span>{total ? `${total} siswa beserta semua jawaban dan nilainya akan dihapus permanen.` : "Belum ada siswa terdaftar."} Tahap kembali ke Pretest. Siswa yang sedang membuka aplikasi akan diminta mengisi nama lagi.</span></p>
    {total ? <button className="button secondary full-width" onClick={onExport}><ArrowDownToLine size={17}/>Unduh rekap CSV dulu</button> : null}
    <form onSubmit={event => { event.preventDefault(); if (ready) setSure(true); }}>
      <label className="field-label dialog-label" htmlFor="reset-phrase">Ketik {RESET_PHRASE} untuk melanjutkan</label>
      <input id="reset-phrase" className="name-input" value={phrase} autoComplete="off" spellCheck={false} onChange={event => { setPhrase(event.target.value); setError(""); }}/>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Batal</button><button type="submit" className="button danger" disabled={!ready}>Lanjutkan</button></div>
    </form>
  </Dialog>;
}
// Tiga pemenang apresiasi (keputusan tim): dua dihitung otomatis (lib/model.ts awards), Teraktif dipilih pendamping.
function Awards({ list, participants, prize, onPrize, final, sample }: { list: Award[]; participants: RekapParticipant[]; prize: Prize; onPrize: (change: Partial<Prize>) => Promise<void>; final: boolean; sample: boolean }) {
  const [saving, setSaving] = useState(false);
  const save = async (change: Partial<Prize>) => { setSaving(true); try { await onPrize(change); } finally { setSaving(false); } };
  const active = participants.find(participant => participant.code === prize.mostActive) ?? null;
  const [best, fastest] = list;
  return <section className="awards" aria-labelledby="awards-title">
    <div className="awards-head">
      <h2 id="awards-title">Pemenang apresiasi</h2>
      <p>{final ? "Sesi sudah ditutup, pemenang sudah final." : "Sementara. Bisa berubah selama posttest masih dikerjakan; umumkan setelah tahap Selesai."}{sample ? " Ini data contoh; pilihan tidak disimpan." : ""}</p>
    </div>
    <div className="award-grid">
      <article className="award-card">
        <span className="award-icon" aria-hidden="true"><Trophy size={24}/></span>
        <span className="step-label">{best.title}</span>
        {best.empty ? <p className="award-empty">{best.empty}</p> : <>
          <h3>{best.winners.map(entry => entry.participant.name).join(", ")}</h3>
          <p className="award-detail">{best.winners.length === 1 ? `Kelas ${best.winners[0].participant.className} · ` : ""}pretest {best.winners[0].pre} + posttest {best.winners[0].post} = {best.winners[0].total}/20</p>
          <AwardNote award={best}/>
        </>}
      </article>
      <article className="award-card fast">
        <span className="award-icon" aria-hidden="true"><Timer size={24}/></span>
        <span className="step-label">{fastest.title}</span>
        {fastest.empty ? <p className="award-empty">{fastest.empty}</p> : <>
          <h3>{fastest.winners.map(entry => entry.participant.name).join(", ")}</h3>
          <p className="award-detail">{fastest.winners.length === 1 ? `Kelas ${fastest.winners[0].participant.className} · ` : ""}posttest {fastest.winners[0].post}/10 · {formatDuration(fastest.winners[0].seconds ?? 0)} untuk kedua tes</p>
          <AwardNote award={fastest}/>
        </>}
        <label className="award-select">Batas hasil bagus: posttest minimal
          <select value={prize.goodScore} disabled={sample || saving} onChange={event => void save({ goodScore: Number(event.target.value) })}>{[6, 7, 8, 9, 10].map(score => <option key={score} value={score}>{score}/10</option>)}</select>
        </label>
      </article>
      <article className="award-card picked">
        <span className="award-icon" aria-hidden="true"><Star size={24}/></span>
        <span className="step-label">Teraktif</span>
        {active ? <><h3>{active.name}</h3><p className="award-detail">Kelas {active.className} · dipilih kakak pendamping</p></> : <p className="award-empty">Dipilih kakak pendamping saat acara, misalnya yang paling aktif bertanya dan menjawab di permainan Detektif AI.</p>}
        <label className="award-select">Siswa teraktif
          <select value={prize.mostActive ?? ""} disabled={sample || saving} onChange={event => void save({ mostActive: event.target.value || null })}>
            <option value="">Belum dipilih</option>
            {[...participants].sort((a, b) => a.name.localeCompare(b.name, "id-ID")).map(participant => <option key={participant.code} value={participant.code}>{participant.name} · Kelas {participant.className}</option>)}
          </select>
        </label>
      </article>
    </div>
    <details className="award-rules">
      <summary>Cara pemenang ditentukan</summary>
      <ul>
        <li>Satu anak paling banyak satu hadiah. Anak yang dipilih sebagai Teraktif tidak dihitung lagi untuk dua hadiah lainnya.</li>
        <li><strong>Nilai Terbaik:</strong> total nilai pretest + posttest tertinggi. Bila sama, posttest yang lebih tinggi. Bila masih sama, yang lebih banyak benar di soal yang paling banyak dijawab salah oleh teman-teman.</li>
        <li><strong>Tercepat dengan Hasil Bagus:</strong> dari anak yang posttest-nya minimal {prize.goodScore}/10, total waktu mengerjakan pretest + posttest paling singkat. Waktu dihitung per anak dari jawaban pertama sampai tombol kirim, jadi anak yang datang terlambat tidak dirugikan.</li>
        <li><strong>Teraktif:</strong> dipilih kakak pendamping saat acara.</li>
      </ul>
    </details>
  </section>;
}

const CRITERION: Record<AwardCriterion, { name: string; reason: string }> = {
  total: { name: "Total nilai", reason: "total nilainya lebih tinggi" },
  score: { name: "nilai posttest", reason: "nilai posttest lebih tinggi" },
  hard: { name: "soal sulit", reason: "benar di soal yang lebih sulit" },
  time: { name: "Waktu", reason: "lebih cepat" },
};

function AwardNote({ award }: { award: Award }) {
  if (award.winners.length > 1) return <p className="award-note tie">Masih seri setelah semua aturan. Tentukan bersama tim, misalnya dengan undian.</p>;
  const other = award.runnerUp?.participant.name;
  if (!other || !award.decidedBy || award.decidedBy === award.order[0]) return null;
  const same = award.order.slice(0, award.order.indexOf(award.decidedBy)).map(criterion => CRITERION[criterion].name).join(" dan ");
  return <p className="award-note">{same} sama dengan {other}; unggul karena {CRITERION[award.decidedBy].reason}.</p>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-table"><strong>{title}</strong><p>{detail}</p></div>;
}
