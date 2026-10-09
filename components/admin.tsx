"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Check, KeyRound, LogOut, Search, Trophy } from "lucide-react";
import { csvCell, phaseLabels, ranking, type Phase, type Rekap, type RekapParticipant, type TestKind } from "@/lib/model";
import { api, errorMessage, errorStatus } from "@/lib/api";
import { StateMessage } from "./state-message";

const phaseOptions: { value: Phase; label: string; description: string }[] = [
  { value: "pretest", label: "Pretest", description: "Sebelum materi" },
  { value: "learning", label: "Belajar", description: "Materi & permainan" },
  { value: "posttest", label: "Posttest", description: "Setelah materi" },
  { value: "closed", label: "Selesai", description: "Tutup sesi" },
];
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
  async function logout() {
    try { await api("/api/pendamping/keluar", { method: "POST" }); } catch {}
    setRekap(null); setSample(false); setStatus("login");
  }

  if (status === "login") return <AdminLogin onDone={() => { setStatus("loading"); void load(sample); }}/>;
  if (status === "loading" || !rekap) return status === "error" ? <StateMessage title="Data kegiatan belum bisa dimuat." detail={error} onRetry={() => load(sample)}/> : <StateMessage title="Memuat data kegiatan..."/>;
  return <Admin rekap={rekap} sample={sample} onSample={() => setSample(!sample)} onPhase={changePhase} phaseSaving={phaseSaving} onLogout={logout} error={error}/>;
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  return <section className="student-layout join-layout content-width">
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
  </section>;
}

function Admin({ rekap, sample, onSample, onPhase, phaseSaving, onLogout, error }: { rekap: Rekap; sample: boolean; onSample: () => void; onPhase: (phase: Phase) => void; phaseSaving: boolean; onLogout: () => void; error: string }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [tab, setTab] = useState<"participants" | "questions" | "ranking">("participants");
  const [testFilter, setTestFilter] = useState<TestKind>("pretest");
  const { phase, questions, participants: data } = rekap;
  const preDone = data.filter(participant => participant.scores.pretest !== null);
  const paired = data.filter(participant => participant.scores.pretest !== null && participant.scores.posttest !== null);
  const average = (kind: TestKind) => paired.length ? paired.reduce((total, participant) => total + (participant.scores[kind] ?? 0), 0) / paired.length : null;
  const preAverage = average("pretest"), postAverage = average("posttest");
  const matches = (participant: RekapParticipant) => participant.name.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")) && (classFilter === "all" || participant.className === classFilter);
  const visible = data.filter(matches);
  const ranks = ranking(data);
  const winners = ranks.filter(item => item.rank === 1);
  const visibleRanks = ranks.filter(item => matches(item.participant));
  const completed = data.filter(participant => participant[testFilter]?.submittedAt);

  function exportCsv() {
    const rows = [["Sumber data", "Nama peserta", "Kelas", "Peringkat posttest", "Nilai pretest", "Nilai posttest", "Selisih poin", "Status", ...Array.from({ length: 10 }, (_, index) => `Pretest ${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `Posttest ${index + 1}`)], ...data.map(participant => {
      const pre = participant.scores.pretest, post = participant.scores.posttest;
      return [sample ? "CONTOH" : "KEGIATAN", participant.name, participant.className, ranks.find(item => item.participant.code === participant.code)?.rank ?? "", pre ?? "", post ?? "", pre !== null && post !== null ? post - pre : "", post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai", ...(["pretest", "posttest"] as const).flatMap(kind => participant[kind]?.answers.map(answer => answer === null ? "" : String.fromCharCode(65 + answer)) ?? Array<string>(10).fill(""))];
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
    <div className="panel session-panel"><div className="panel-title"><div><h2>Atur sesi kegiatan</h2><p>Pilih tahap yang sedang berlangsung.</p></div><span className="status-pill blue" role="status">{phaseSaving ? "Menyimpan..." : phaseLabels[phase]}</span></div><div className="phase-switch">{phaseOptions.map((option, index) => <button key={option.value} className={phase === option.value ? "active" : ""} aria-pressed={phase === option.value} disabled={phaseSaving} onClick={() => onPhase(option.value)}><span className="phase-number">{phase === option.value ? <Check size={18}/> : index + 1}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></button>)}</div><p className="field-hint">Posttest bisa dimulai setelah pretest selesai. Perubahan tahap sampai ke perangkat siswa dalam beberapa detik.</p></div>
    <dl className="admin-stats"><div><dt>Peserta terdaftar</dt><dd>{data.length}<span>siswa</span></dd><p>{data.filter(item => item.className === "V").length} kelas V · {data.filter(item => item.className === "VI").length} kelas VI</p></div><div><dt>Pretest selesai</dt><dd>{preDone.length}<span>dari {data.length}</span></dd><p>{data.length - preDone.length} belum selesai</p></div><div><dt>Kedua tes selesai</dt><dd>{paired.length}<span>dari {data.length}</span></dd><p>Siap ditampilkan dalam peringkat</p></div></dl>
    <div className="panel roster-panel">
      <div className="roster-top"><div className="admin-tabs" aria-label="Pilih rekap"><button className={tab === "participants" ? "active" : ""} aria-pressed={tab === "participants"} onClick={() => setTab("participants")}>Peserta <span>{data.length}</span></button><button className={tab === "ranking" ? "active" : ""} aria-pressed={tab === "ranking"} onClick={() => setTab("ranking")}>Peringkat</button><button className={tab === "questions" ? "active" : ""} aria-pressed={tab === "questions"} onClick={() => setTab("questions")}>Analisis soal</button></div><button className="button secondary export-button" onClick={exportCsv}><ArrowDownToLine size={17}/>Unduh rekap CSV</button></div>
      {tab !== "questions" ? <div className="table-controls"><label className="search-field"><Search size={18} aria-hidden="true"/><input type="search" placeholder="Cari nama peserta" aria-label="Cari nama peserta" value={search} onChange={event => setSearch(event.target.value)}/></label><label className="filter-field">Kelas<select aria-label="Filter kelas" value={classFilter} onChange={event => setClassFilter(event.target.value)}><option value="all">Semua kelas</option><option value="V">Kelas V</option><option value="VI">Kelas VI</option></select></label></div> : null}
      {tab === "participants" ? <>
        <div className="table-scroll"><table><caption className="sr-only">Rekap hasil peserta {sample ? "contoh" : "kegiatan"}</caption><thead><tr><th>Nama peserta</th><th>Kelas</th><th>Pretest</th><th>Posttest</th><th>Perubahan</th><th>Status</th></tr></thead><tbody>{visible.map(participant => {
          const pre = participant.scores.pretest, post = participant.scores.posttest;
          const progress = (kind: TestKind) => participant[kind] && !participant[kind]!.submittedAt ? `Mengerjakan ${participant[kind]!.answers.filter(answer => answer !== null).length}/10` : "Belum";
          return <tr key={participant.code}><td className="table-name">{participant.name}</td><td>{participant.className}</td><td>{pre === null ? <span className="score-missing">{progress("pretest")}</span> : `${pre}/10`}</td><td>{post === null ? <span className="score-missing">{progress("posttest")}</span> : `${post}/10`}</td><td>{pre !== null && post !== null ? `${post - pre > 0 ? "+" : ""}${post - pre} poin` : <span className="score-missing">Belum lengkap</span>}</td><td><span className={`status-pill ${post !== null ? "green" : pre !== null ? "blue" : "neutral"}`}>{post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai"}</span></td></tr>;
        })}</tbody></table></div>
        {!visible.length ? <Empty title={data.length ? "Tidak ada peserta yang cocok." : "Belum ada peserta terdaftar."} detail={data.length ? "Coba nama lain atau pilih semua kelas." : "Siswa bisa mulai dari Beranda dengan mengisi nama dan kelas."}/> : null}
        <div className="table-footer">Menampilkan {visible.length} dari {data.length} peserta</div>
      </> : tab === "ranking" ? <>
        <div className="ranking-note"><h2>{phase === "closed" ? "Peringkat hasil belajar" : "Peringkat sementara"}</h2><p>Berdasarkan nilai posttest. Nilai sama berbagi peringkat.</p></div>
        {winners.length ? <div className="winner-banner"><Trophy size={30} aria-hidden="true"/><div><span className="step-label">{sample ? "Contoh peringkat pertama" : "Peringkat pertama"}</span><h3>{winners.map(item => item.participant.name).join(", ")}</h3><p>Nilai posttest {winners[0].points}/10{winners.length > 1 ? " · Juara bersama" : ""}</p></div></div> : <Empty title="Belum ada posttest yang dikirim." detail="Peringkat muncul setelah peserta menyelesaikan kedua tes."/>}
        {ranks.length ? <><div className="table-scroll"><table><caption className="sr-only">Peringkat peserta berdasarkan posttest</caption><thead><tr><th>Peringkat</th><th>Nama peserta</th><th>Kelas</th><th>Posttest</th><th>Pretest</th></tr></thead><tbody>{visibleRanks.map(({ participant, points, rank }) => <tr key={participant.code}><td><span className={`rank-badge ${rank === 1 ? "first" : ""}`}>{rank}</span></td><td className="table-name">{participant.name}</td><td>{participant.className}</td><td><strong>{points}/10</strong></td><td>{participant.scores.pretest}/10</td></tr>)}</tbody></table></div>{!visibleRanks.length ? <Empty title="Tidak ada peserta yang cocok." detail="Coba nama lain atau pilih semua kelas."/> : null}<div className="table-footer"><span>Menampilkan {visibleRanks.length} dari {ranks.length} peserta selesai</span><span>Peringkat tetap sama saat difilter.</span></div></> : null}
      </> : <div className="analysis-panel">
        <div className="comparison-panel"><div><h2>Gambaran pemahaman</h2><p>Dari {paired.length} peserta dengan kedua tes selesai.</p></div><div className="comparison-values"><span>Pretest<strong>{format(preAverage)}{preAverage !== null ? "/10" : ""}</strong></span><span>Posttest<strong>{format(postAverage)}{postAverage !== null ? "/10" : ""}</strong></span><span>Perubahan<strong>{postAverage !== null && preAverage !== null ? `${postAverage - preAverage > 0 ? "+" : ""}${format(postAverage - preAverage)} poin` : "Belum ada"}</strong></span></div><p className="field-hint">Bentuk soal berbeda. Selisih nilai adalah gambaran deskriptif.</p></div>
        <div className="analysis-top"><div><h2>Jawaban per soal</h2><p>{completed.length} tes sudah dikirim.</p></div><div className="segmented-control" aria-label="Pilih tes untuk analisis">{(["pretest", "posttest"] as TestKind[]).map(kind => <button key={kind} aria-pressed={testFilter === kind} className={testFilter === kind ? "active" : ""} onClick={() => setTestFilter(kind)}>{kind === "pretest" ? "Pretest" : "Posttest"}</button>)}</div></div>
        {questions[testFilter].map((question, index) => {
          const correct = completed.filter(participant => participant[testFilter]?.answers[index] === question.correct).length;
          const percent = completed.length ? Math.round(correct / completed.length * 100) : null;
          return <div className="analysis-row" key={question.id}><span className="explanation-number">{question.id}</span><div><strong>{question.text}</strong><p>{correct} dari {completed.length} peserta menjawab benar</p></div><div className="analysis-measure"><div className="analysis-bar"><span style={{ width: `${percent ?? 0}%` }}/></div><span>{percent === null ? "Belum ada" : `${percent}%`}</span></div></div>;
        })}
      </div>}
    </div>
  </section>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-table"><strong>{title}</strong><p>{detail}</p></div>;
}
