"use client";

import { useState } from "react";
import { ArrowDownToLine, Check, Search, Trophy } from "lucide-react";
import { csvCell, phaseLabels, questions, ranking, sampleParticipants, score, type Participant, type Phase, type TestKind } from "@/lib/model";

const phaseOptions: { value: Phase; label: string; description: string }[] = [
  { value: "pretest", label: "Pretest", description: "Sebelum materi" },
  { value: "learning", label: "Belajar", description: "Materi & permainan" },
  { value: "posttest", label: "Posttest", description: "Setelah materi" },
  { value: "closed", label: "Selesai", description: "Tutup sesi" },
];
const format = (value: number | null) => value === null ? "Belum ada" : value.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export function Admin({ participants, phase, onPhase }: { participants: Participant[]; phase: Phase; onPhase: (phase: Phase) => void }) {
  const [sample, setSample] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [tab, setTab] = useState<"participants" | "questions" | "ranking">("participants");
  const [testFilter, setTestFilter] = useState<TestKind>("pretest");
  const data = sample ? sampleParticipants() : participants;
  const preDone = data.filter(participant => !!participant.pretest?.submittedAt);
  const paired = data.filter(participant => !!participant.pretest?.submittedAt && !!participant.posttest?.submittedAt);
  const average = (kind: TestKind) => paired.length ? paired.reduce((total, participant) => total + (score(participant[kind], kind) ?? 0), 0) / paired.length : null;
  const preAverage = average("pretest"), postAverage = average("posttest");
  const matches = (participant: Participant) => participant.name.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")) && (classFilter === "all" || participant.className === classFilter);
  const visible = data.filter(matches);
  const ranks = ranking(data);
  const winners = ranks.filter(item => item.rank === 1);
  const visibleRanks = ranks.filter(item => matches(item.participant));
  const completed = data.filter(participant => participant[testFilter]?.submittedAt);

  function exportCsv() {
    const rows = [["Sumber data", "Nama peserta", "Kelas", "Peringkat posttest", "Nilai pretest", "Nilai posttest", "Selisih poin", "Status", ...Array.from({ length: 10 }, (_, index) => `Pretest ${index + 1}`), ...Array.from({ length: 10 }, (_, index) => `Posttest ${index + 1}`)], ...data.map(participant => {
      const pre = score(participant.pretest, "pretest"), post = score(participant.posttest, "posttest");
      return [sample ? "CONTOH" : "DEMO LOKAL", participant.name, participant.className, ranks.find(item => item.participant.code === participant.code)?.rank ?? "", pre ?? "", post ?? "", pre !== null && post !== null ? post - pre : "", post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai", ...(["pretest", "posttest"] as const).flatMap(kind => participant[kind]?.answers.map(answer => answer === null ? "" : String.fromCharCode(65 + answer)) ?? Array<string>(10).fill(""))];
    })];
    const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `rekap-ai-${sample ? "contoh" : "demo-lokal"}.csv`;
    anchor.click(); URL.revokeObjectURL(url);
  }

  return <section className="admin-layout content-width">
    <div className="admin-heading"><div><span className="section-kicker">Ruang pendamping</span><h1>Pantau kegiatan siswa.</h1><p>SDN Karangsari Yogyakarta · 13 Oktober 2026</p></div><button className="text-button" aria-pressed={sample} onClick={() => setSample(!sample)}>{sample ? "Kembali ke data lokal" : "Lihat data contoh"}</button></div>
    <p className="local-notice">Pratinjau frontend. Data dan pengaturan sesi tersimpan di browser ini.</p>
    {sample ? <div className="sample-notice" role="status"><strong>Data contoh.</strong> Nama dan jawaban di bawah adalah simulasi. Pengaturan sesi tetap mengatur peserta lokal.</div> : null}
    <div className="panel session-panel"><div className="panel-title"><div><h2>Atur sesi kegiatan</h2><p>Pilih tahap yang sedang berlangsung.</p></div><span className="status-pill blue" role="status">{phaseLabels[phase]}</span></div><div className="phase-switch">{phaseOptions.map((option, index) => <button key={option.value} className={phase === option.value ? "active" : ""} aria-pressed={phase === option.value} onClick={() => onPhase(option.value)}><span className="phase-number">{phase === option.value ? <Check size={18}/> : index + 1}</span><span><strong>{option.label}</strong><small>{option.description}</small></span></button>)}</div><p className="field-hint">Posttest bisa dimulai setelah pretest selesai. Perubahan sesi langsung berlaku pada halaman siswa di browser ini.</p></div>
    <dl className="admin-stats"><div><dt>Peserta terdaftar</dt><dd>{data.length}<span>siswa</span></dd><p>{data.filter(item => item.className === "V").length} kelas V · {data.filter(item => item.className === "VI").length} kelas VI</p></div><div><dt>Pretest selesai</dt><dd>{preDone.length}<span>dari {data.length}</span></dd><p>{data.length - preDone.length} belum selesai</p></div><div><dt>Kedua tes selesai</dt><dd>{paired.length}<span>dari {data.length}</span></dd><p>Siap ditampilkan dalam peringkat</p></div></dl>
    <div className="panel roster-panel">
      <div className="roster-top"><div className="admin-tabs" aria-label="Pilih rekap"><button className={tab === "participants" ? "active" : ""} aria-pressed={tab === "participants"} onClick={() => setTab("participants")}>Peserta <span>{data.length}</span></button><button className={tab === "ranking" ? "active" : ""} aria-pressed={tab === "ranking"} onClick={() => setTab("ranking")}>Peringkat</button><button className={tab === "questions" ? "active" : ""} aria-pressed={tab === "questions"} onClick={() => setTab("questions")}>Analisis soal</button></div><button className="button secondary export-button" onClick={exportCsv}><ArrowDownToLine size={17}/>Unduh rekap CSV</button></div>
      {tab !== "questions" ? <div className="table-controls"><label className="search-field"><Search size={18} aria-hidden="true"/><input type="search" placeholder="Cari nama peserta" aria-label="Cari nama peserta" value={search} onChange={event => setSearch(event.target.value)}/></label><label className="filter-field">Kelas<select aria-label="Filter kelas" value={classFilter} onChange={event => setClassFilter(event.target.value)}><option value="all">Semua kelas</option><option value="V">Kelas V</option><option value="VI">Kelas VI</option></select></label></div> : null}
      {tab === "participants" ? <>
        <div className="table-scroll"><table><caption className="sr-only">Rekap hasil peserta {sample ? "contoh" : "lokal"}</caption><thead><tr><th>Nama peserta</th><th>Kelas</th><th>Pretest</th><th>Posttest</th><th>Perubahan</th><th>Status</th></tr></thead><tbody>{visible.map(participant => {
          const pre = score(participant.pretest, "pretest"), post = score(participant.posttest, "posttest");
          return <tr key={participant.code}><td className="table-name">{participant.name}</td><td>{participant.className}</td><td>{pre === null ? <span className="score-missing">Belum</span> : `${pre}/10`}</td><td>{post === null ? <span className="score-missing">Belum</span> : `${post}/10`}</td><td>{pre !== null && post !== null ? `${post - pre > 0 ? "+" : ""}${post - pre} poin` : <span className="score-missing">Belum lengkap</span>}</td><td><span className={`status-pill ${post !== null ? "green" : pre !== null ? "blue" : "neutral"}`}>{post !== null ? "Kedua tes selesai" : pre !== null ? "Pretest selesai" : "Belum selesai"}</span></td></tr>;
        })}</tbody></table></div>
        {!visible.length ? <Empty title={data.length ? "Tidak ada peserta yang cocok." : "Belum ada peserta terdaftar."} detail={data.length ? "Coba nama lain atau pilih semua kelas." : "Siswa bisa mulai dari Beranda dengan mengisi nama dan kelas."}/> : null}
        <div className="table-footer">Menampilkan {visible.length} dari {data.length} peserta</div>
      </> : tab === "ranking" ? <>
        <div className="ranking-note"><h2>{phase === "closed" ? "Peringkat hasil belajar" : "Peringkat sementara"}</h2><p>Berdasarkan nilai posttest. Nilai sama berbagi peringkat.</p></div>
        {winners.length ? <div className="winner-banner"><Trophy size={30} aria-hidden="true"/><div><span className="step-label">{sample ? "Contoh peringkat pertama" : "Peringkat pertama"}</span><h3>{winners.map(item => item.participant.name).join(", ")}</h3><p>Nilai posttest {winners[0].points}/10{winners.length > 1 ? " · Juara bersama" : ""}</p></div></div> : <Empty title="Belum ada posttest yang dikirim." detail="Peringkat muncul setelah peserta menyelesaikan kedua tes."/>}
        {ranks.length ? <><div className="table-scroll"><table><caption className="sr-only">Peringkat peserta berdasarkan posttest</caption><thead><tr><th>Peringkat</th><th>Nama peserta</th><th>Kelas</th><th>Posttest</th><th>Pretest</th></tr></thead><tbody>{visibleRanks.map(({ participant, points, rank }) => <tr key={participant.code}><td><span className={`rank-badge ${rank === 1 ? "first" : ""}`}>{rank}</span></td><td className="table-name">{participant.name}</td><td>{participant.className}</td><td><strong>{points}/10</strong></td><td>{score(participant.pretest, "pretest")}/10</td></tr>)}</tbody></table></div>{!visibleRanks.length ? <Empty title="Tidak ada peserta yang cocok." detail="Coba nama lain atau pilih semua kelas."/> : null}<div className="table-footer"><span>Menampilkan {visibleRanks.length} dari {ranks.length} peserta selesai</span><span>Peringkat tetap sama saat difilter.</span></div></> : null}
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
