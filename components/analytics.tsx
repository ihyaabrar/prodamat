"use client";

import { useState } from "react";
import type { ClassName, Question, RekapParticipant, TestKind } from "@/lib/model";

// Warna seri divalidasi dengan dataviz validate_palette.js (CVD, kontras >= 3:1 di latar putih).
const SERIES: Record<TestKind, { label: string; color: string }> = {
  pretest: { label: "Tes awal", color: "#6f8ae6" },
  posttest: { label: "Tes akhir", color: "#2244bd" },
};
// Divergen: dua kutub + titik tengah abu-abu netral. Selalu disertai label teks.
const CHANGE = [
  { key: "up", label: "Naik", color: "#237a4e" },
  { key: "same", label: "Tetap", color: "#8a96a6" },
  { key: "down", label: "Turun", color: "#c77c12" },
] as const;

const fmt = (value: number, digits = 1) => value.toLocaleString("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const pct = (part: number, whole: number) => whole ? Math.round(part / whole * 100) : 0;
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const classLabel = (className: ClassName) => className === "V" ? "Kelas 5" : "Kelas 6";

export function Analytics({ participants, questions, sample }: { participants: RekapParticipant[]; questions: Record<TestKind, Question[]>; sample: boolean }) {
  const paired = participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null);
  const preAvg = mean(paired.map(item => item.scores.pretest!));
  const postAvg = mean(paired.map(item => item.scores.posttest!));
  const changes = { up: 0, same: 0, down: 0 };
  for (const item of paired) {
    const diff = item.scores.posttest! - item.scores.pretest!;
    changes[diff > 0 ? "up" : diff < 0 ? "down" : "same"]++;
  }
  const preSent = participants.filter(item => item.scores.pretest !== null).length;
  const postSent = participants.filter(item => item.scores.posttest !== null).length;

  return <div className="analytics">
    {sample ? <p className="analytics-note">Grafik di bawah memakai data contoh.</p> : null}
    <dl className="stat-tiles">
      <div><dt>Pasangan tes lengkap</dt><dd>{paired.length}</dd><p>dari {participants.length} siswa terdaftar</p></div>
      <div><dt>Rata-rata tes awal</dt><dd>{preAvg === null ? "–" : fmt(preAvg)}<small>/10</small></dd><p>pasangan lengkap saja</p></div>
      <div className="tile-accent"><dt>Rata-rata tes akhir</dt><dd>{postAvg === null ? "–" : fmt(postAvg)}<small>/10</small></dd><p>{preAvg !== null && postAvg !== null ? `${postAvg - preAvg >= 0 ? "+" : ""}${fmt(postAvg - preAvg)} poin dari tes awal` : "belum ada pasangan"}</p></div>
      <div><dt>Siswa yang nilainya naik</dt><dd>{paired.length ? `${pct(changes.up, paired.length)}%` : "–"}</dd><p>{changes.up} dari {paired.length} siswa</p></div>
    </dl>

    <div className="chart-grid">
      <Funnel total={participants.length} preSent={preSent} postSent={postSent}/>
      {paired.length ? <ChangeBar changes={changes} total={paired.length}/> : <ChartEmpty title="Perubahan nilai per siswa"/>}
      {paired.length ? <Histogram paired={paired}/> : <ChartEmpty title="Sebaran nilai tes awal dan tes akhir" wide/>}
      {paired.length ? <ByClass paired={paired}/> : <ChartEmpty title="Rata-rata per kelas"/>}
      <HardestQuestions participants={participants} questions={questions}/>
    </div>
    <p className="field-hint">Soal tes awal dan tes akhir berbeda. Selisih nilai adalah gambaran deskriptif, bukan ukuran pengaruh kegiatan.</p>
  </div>;
}

function Chart({ title, question, wide = false, legend, table, children }: { title: string; question: string; wide?: boolean; legend?: React.ReactNode; table: React.ReactNode; children: React.ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return <figure className={`chart-card${wide ? " wide" : ""}`}>
    <figcaption><h3>{title}</h3><p>{question}</p></figcaption>
    {legend ? <div className="chart-legend">{legend}</div> : null}
    {showTable ? <div className="chart-table">{table}</div> : children}
    <button className="text-button chart-toggle" aria-pressed={showTable} onClick={() => setShowTable(!showTable)}>{showTable ? "Lihat sebagai grafik" : "Lihat sebagai tabel"}</button>
  </figure>;
}

function ChartEmpty({ title, wide = false }: { title: string; wide?: boolean }) {
  return <figure className={`chart-card empty${wide ? " wide" : ""}`}><figcaption><h3>{title}</h3></figcaption><p className="chart-empty">Grafik ini muncul setelah ada siswa yang menyelesaikan tes awal dan tes akhir.</p></figure>;
}

const Swatch = ({ color, label }: { color: string; label: string }) => <span className="legend-item"><span className="legend-swatch" style={{ background: color }}/>{label}</span>;

function Funnel({ total, preSent, postSent }: { total: number; preSent: number; postSent: number }) {
  const rows = [
    { label: "Terdaftar", value: total },
    { label: "Mengirim tes awal", value: preSent },
    { label: "Mengirim tes akhir", value: postSent },
  ];
  return <Chart title="Alur kegiatan" question="Berapa siswa yang sudah sampai di tiap langkah?" table={<table><thead><tr><th>Langkah</th><th>Siswa</th><th>Dari terdaftar</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.value}</td><td>{pct(row.value, total)}%</td></tr>)}</tbody></table>}>
    <div className="hbars">{rows.map(row => <div className="hbar-row" key={row.label}>
      <span className="hbar-label">{row.label}</span>
      <span className="hbar-track"><span className="hbar-fill" tabIndex={0} data-tip={`${row.label}: ${row.value} siswa (${pct(row.value, total)}%)`} style={{ width: `${total ? Math.max(row.value / total * 100, row.value ? 2 : 0) : 0}%`, background: "#2244bd" }}/></span>
      <span className="hbar-value">{row.value}</span>
    </div>)}</div>
  </Chart>;
}

function ChangeBar({ changes, total }: { changes: Record<"up" | "same" | "down", number>; total: number }) {
  return <Chart title="Perubahan nilai per siswa" question="Dari siswa dengan kedua tes, berapa yang nilainya naik, tetap, atau turun?"
    legend={CHANGE.map(item => <Swatch key={item.key} color={item.color} label={`${item.label} ${changes[item.key]} (${pct(changes[item.key], total)}%)`}/>)}
    table={<table><thead><tr><th>Perubahan</th><th>Siswa</th><th>Persen</th></tr></thead><tbody>{CHANGE.map(item => <tr key={item.key}><td>{item.label}</td><td>{changes[item.key]}</td><td>{pct(changes[item.key], total)}%</td></tr>)}</tbody></table>}>
    <div className="stack-bar">{CHANGE.filter(item => changes[item.key]).map(item => <span key={item.key} className="stack-seg" tabIndex={0} data-tip={`${item.label}: ${changes[item.key]} siswa (${pct(changes[item.key], total)}%)`} style={{ flexGrow: changes[item.key], background: item.color }}><span className="stack-text">{pct(changes[item.key], total) >= 12 ? `${pct(changes[item.key], total)}%` : ""}</span></span>)}</div>
  </Chart>;
}

function Histogram({ paired }: { paired: RekapParticipant[] }) {
  const bins = Array.from({ length: 11 }, (_, score) => ({
    score,
    pretest: paired.filter(item => item.scores.pretest === score).length,
    posttest: paired.filter(item => item.scores.posttest === score).length,
  }));
  const max = Math.max(1, ...bins.flatMap(bin => [bin.pretest, bin.posttest]));
  const ticks = [max, Math.round(max / 2), 0].filter((value, index, all) => all.indexOf(value) === index);
  return <Chart wide title="Sebaran nilai tes awal dan tes akhir" question="Berapa siswa mendapat tiap nilai, 0 sampai 10?"
    legend={(["pretest", "posttest"] as TestKind[]).map(kind => <Swatch key={kind} color={SERIES[kind].color} label={SERIES[kind].label}/>)}
    table={<table><thead><tr><th>Nilai</th><th>Tes awal</th><th>Tes akhir</th></tr></thead><tbody>{bins.map(bin => <tr key={bin.score}><td>{bin.score}</td><td>{bin.pretest}</td><td>{bin.posttest}</td></tr>)}</tbody></table>}>
    <div className="histogram">
      <div className="hist-axis" aria-hidden="true">{ticks.map(tick => <span key={tick} style={{ bottom: `${tick / max * 100}%` }}>{tick}</span>)}</div>
      <div className="hist-plot">
        {ticks.map(tick => <span key={tick} className="hist-grid" style={{ bottom: `${tick / max * 100}%` }} aria-hidden="true"/>)}
        {bins.map(bin => <div className="hist-bin" key={bin.score} tabIndex={0} data-tip={`Nilai ${bin.score}: tes awal ${bin.pretest} siswa, tes akhir ${bin.posttest} siswa`}>
          <div className="hist-bars">{(["pretest", "posttest"] as TestKind[]).map(kind => <span key={kind} className="hist-bar" style={{ height: `${bin[kind] / max * 100}%`, background: SERIES[kind].color }}/>)}</div>
          <span className="hist-x">{bin.score}</span>
        </div>)}
      </div>
    </div>
    <p className="chart-axis-title">Nilai (jumlah jawaban tepat) · tinggi batang = jumlah siswa</p>
  </Chart>;
}

function ByClass({ paired }: { paired: RekapParticipant[] }) {
  const rows = (["V", "VI"] as ClassName[]).map(className => {
    const group = paired.filter(item => item.className === className);
    return { className, n: group.length, pretest: mean(group.map(item => item.scores.pretest!)), posttest: mean(group.map(item => item.scores.posttest!)) };
  }).filter(row => row.n);
  return <Chart title="Rata-rata per kelas" question="Apakah kelas 5 dan kelas 6 berbeda?"
    legend={(["pretest", "posttest"] as TestKind[]).map(kind => <Swatch key={kind} color={SERIES[kind].color} label={SERIES[kind].label}/>)}
    table={<table><thead><tr><th>Kelas</th><th>Siswa</th><th>Tes awal</th><th>Tes akhir</th></tr></thead><tbody>{rows.map(row => <tr key={row.className}><td>{classLabel(row.className)}</td><td>{row.n}</td><td>{fmt(row.pretest!)}</td><td>{fmt(row.posttest!)}</td></tr>)}</tbody></table>}>
    <div className="class-groups">{rows.map(row => <div className="class-group" key={row.className}>
      <p className="class-group-title">{classLabel(row.className)} <span>· {row.n} siswa</span></p>
      {(["pretest", "posttest"] as TestKind[]).map(kind => <div className="hbar-row" key={kind}>
        <span className="hbar-label">{SERIES[kind].label}</span>
        <span className="hbar-track"><span className="hbar-fill" tabIndex={0} data-tip={`${classLabel(row.className)}, ${SERIES[kind].label.toLowerCase()}: rata-rata ${fmt(row[kind]!)} dari 10`} style={{ width: `${row[kind]! * 10}%`, background: SERIES[kind].color }}/></span>
        <span className="hbar-value">{fmt(row[kind]!)}</span>
      </div>)}
    </div>)}</div>
  </Chart>;
}

function HardestQuestions({ participants, questions }: { participants: RekapParticipant[]; questions: Record<TestKind, Question[]> }) {
  const kind: TestKind = participants.some(item => item.scores.posttest !== null) ? "posttest" : "pretest";
  const done = participants.filter(item => item[kind]?.submittedAt);
  if (!done.length) return <ChartEmpty title="Soal yang paling perlu diulas"/>;
  const rows = questions[kind].map((question, index) => ({ number: index + 1, text: question.text, percent: pct(done.filter(item => item[kind]!.answers[index] === question.correct).length, done.length) }))
    .sort((a, b) => a.percent - b.percent).slice(0, 3);
  return <Chart title="Soal yang paling perlu diulas" question={`Tiga soal ${SERIES[kind].label.toLowerCase()} dengan persentase benar terendah (${done.length} siswa).`}
    table={<table><thead><tr><th>Soal</th><th>Benar</th></tr></thead><tbody>{rows.map(row => <tr key={row.number}><td>{row.number}. {row.text}</td><td>{row.percent}%</td></tr>)}</tbody></table>}>
    <ol className="hard-list">{rows.map(row => <li key={row.number}>
      <span className="hard-number">{row.number}</span>
      <div><p className="hard-text">{row.text}</p><div className="hbar-row compact"><span className="hbar-track"><span className="hbar-fill" tabIndex={0} data-tip={`Soal ${row.number}: ${row.percent}% benar`} style={{ width: `${Math.max(row.percent, 2)}%`, background: SERIES[kind].color }}/></span><span className="hbar-value">{row.percent}%</span></div></div>
    </li>)}</ol>
  </Chart>;
}
