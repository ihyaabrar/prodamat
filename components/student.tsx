"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Check, CheckCircle2, Clock, Lightbulb, LockKeyhole, RotateCcw, Send, Trophy, ClipboardCheck, ClipboardList } from "lucide-react";
import { canStart, validName, type ClassName, type Participant, type Phase, type Results as ResultData, type TestKind } from "@/lib/model";
import { Aiko, AikoIcon, AikoSays } from "./robot";
import { Aiko3D } from "./aiko-3d";
import type { AikoPose } from "@/lib/aiko-art";
import { Dialog } from "./dialog";

const classLabel = (className: ClassName) => className === "V" ? "5" : "6";

export function Join({ onJoin, onBack }: { onJoin: (name: string, className: ClassName) => Promise<string | null>; onBack: () => void }) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState<ClassName | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  return <section className="student-layout join-layout content-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={18}/> Kembali ke beranda</button>
    <h1 className="join-title">Kenalan dulu, yuk!</h1>
    <AikoSays pose="wave">Tulis namamu, lalu pilih kelasmu. Tidak perlu email atau kata sandi.</AikoSays>
    <form className="panel join-panel" onSubmit={async event => { event.preventDefault(); if (sending) return; if (!className || !validName(name)) { setError("Tulis nama minimal 2 huruf dan pilih kelasmu, ya."); return; } setSending(true); const problem = await onJoin(name, className); setSending(false); if (problem) setError(problem); }}>
      <label className="field-label" htmlFor="participant-name"><span className="field-number" aria-hidden="true">1</span>Nama lengkapmu</label>
      <input id="participant-name" className="name-input" placeholder="Tulis nama lengkapmu" value={name} maxLength={60} required minLength={2} autoComplete="off" autoCapitalize="words" spellCheck={false} aria-describedby={error ? "name-error name-hint" : "name-hint"} aria-invalid={!!error} onChange={event => { setName(event.target.value); setError(""); }}/>
      <p className="field-hint" id="name-hint">Tulis nama lengkap seperti di absen kelas. Pakai nama yang sama saat pretest dan posttest, ya.</p>
      <fieldset className="class-options">
        <legend className="field-label"><span className="field-number" aria-hidden="true">2</span>Kelasmu</legend>
        {(["V", "VI"] as ClassName[]).map(value => <label className={className === value ? "selected" : ""} key={value}>
          <input type="radio" name="class" value={value} required checked={className === value} onChange={() => { setClassName(value); setError(""); }}/>
          <span className="class-number">{classLabel(value)}</span><span className="class-name">Kelas {classLabel(value)}<small>Kelas {value}</small></span>
          <span className="option-check">{className === value ? <Check size={18} strokeWidth={3}/> : null}</span>
        </label>)}
      </fieldset>
      {error ? <p id="name-error" className="field-error" role="alert">{error}</p> : null}
      {!sending && (!validName(name) || !className) ? <p className="field-hint join-missing" aria-live="polite">{!validName(name) ? "Tulis namamu dulu, lalu pilih kelas." : "Sekarang pilih kelasmu."}</p> : null}
      <button className="button primary full-width big" disabled={!validName(name) || !className || sending} type="submit">{sending ? "Sebentar, ya..." : <>Ayo masuk<ArrowRight size={20} strokeWidth={2.5}/></>}</button>
      <p className="privacy-note"><AikoIcon name="safe-data"/><span>Nama dan kelas dipakai untuk menyambungkan hasil pretest dan posttest-mu.</span></p>
    </form>
  </section>;
}

type StopState = "done" | "now" | "wait";
type Stop = { key: string; title: string; step: string; icon: React.ReactNode; art?: boolean; state: StopState; detail: string; action?: React.ReactNode };

export function StudentHub({ participant, phase, aiko3d, onStart, onChange, onResults }: { participant: Participant; phase: Phase; aiko3d: boolean; onStart: (kind: TestKind) => void; onChange: () => void; onResults: () => void }) {
  const [confirmChange, setConfirmChange] = useState(false);
  const preDone = !!participant.pretest?.submittedAt;
  const postDone = !!participant.posttest?.submittedAt;
  const answered = (kind: TestKind) => participant[kind]?.answers.filter(answer => answer !== null).length ?? 0;
  const testStop = (kind: TestKind): Pick<Stop, "state" | "detail" | "action"> => {
    if (participant[kind]?.submittedAt) return { state: "done", detail: "Sudah dikirim. Hebat!" };
    if (canStart(participant, phase, kind)) {
      const count = answered(kind);
      return { state: "now", detail: count ? `${count} dari 10 soal sudah kamu jawab.` : "Jawab sesuai yang kamu pahami. Tidak perlu buru-buru.", action: <button className="button primary full-width big" onClick={() => onStart(kind)}>{count ? "Lanjutkan" : "Mulai"} {kind}<ArrowRight size={20} strokeWidth={2.5}/></button> };
    }
    if (kind === "posttest" && !preDone) return { state: "wait", detail: "Selesaikan pretest dulu." };
    return { state: "wait", detail: phase === "closed" ? "Sesi sudah ditutup." : "Menunggu kakak pendamping membukanya." };
  };
  const learningState: StopState = phase === "learning" ? "now" : phase === "posttest" || phase === "closed" ? "done" : "wait";
  const stops: Stop[] = [
    { key: "pretest", title: "Pretest", step: "Langkah 1 · Sebelum belajar", icon: <ClipboardList size={24} strokeWidth={2.3}/>, ...testStop("pretest") },
    { key: "learning", title: "Jadi Detektif AI", step: "Langkah 2 · Belajar", icon: <AikoIcon name="ai-detective"/>, art: true, state: learningState, detail: learningState === "now" ? "Sekarang! Dengarkan kakak pendamping." : learningState === "done" ? "Materi dan permainan selesai." : preDone ? "Tunggu kakak pendamping memulainya." : "Dimulai setelah pretest." },
    { key: "posttest", title: "Posttest", step: "Langkah 3 · Setelah belajar", icon: <ClipboardCheck size={24} strokeWidth={2.3}/>, ...testStop("posttest") },
  ];
  const message = postDone ? "Hebat! Kedua tes sudah selesai. Yuk, lihat hasil belajarmu."
    : canStart(participant, phase, "pretest") ? answered("pretest") ? "Kamu sudah mulai pretest. Ayo lanjutkan dari soal yang belum dijawab." : "Pertama, kerjakan pretest. Jawab sesuai yang kamu tahu, ya."
    : canStart(participant, phase, "posttest") ? "Posttest sudah dibuka! Tunjukkan hal baru yang kamu pelajari."
    : phase === "learning" ? "Waktunya jadi Detektif AI! Ikuti materi dan permainan bersama kakak pendamping."
    : phase === "closed" ? "Kegiatan hari ini sudah selesai. Terima kasih sudah belajar!"
    : phase === "posttest" && !preDone ? "Posttest bisa dikerjakan setelah pretest. Angkat tangan dan panggil kakak pendamping, ya."
    : "Pretest selesai! Tunggu kakak pendamping memulai kegiatan berikutnya.";
  const pose: AikoPose = postDone ? "celebrate"
    : canStart(participant, phase, "pretest") ? answered("pretest") ? "reassure" : "wave"
    : canStart(participant, phase, "posttest") ? "wave"
    : phase === "learning" ? "reading"
    : phase === "posttest" && !preDone ? "reassure"
    : "idle";
  return <section className="student-layout content-width">
    {confirmChange ? <Dialog title={`Kamu bukan ${participant.name}?`} onClose={() => setConfirmChange(false)}>
      <p>Kalau keluar, jawaban {participant.name} tetap aman. Untuk kembali, tulis nama dan kelas yang sama persis.</p>
      <div className="modal-actions"><button className="button secondary" onClick={() => setConfirmChange(false)}>Tidak, ini aku</button><button className="button primary" onClick={() => { setConfirmChange(false); onChange(); }}>Ya, ganti nama</button></div>
    </Dialog> : null}
    <div className="hub-heading">
      <div><p className="kicker">Kelas {classLabel(participant.className)} · Petualangan belajarmu</p><h1>Halo, {participant.name}!</h1></div>
      <button className="text-button" onClick={() => setConfirmChange(true)}><RotateCcw size={17}/> Bukan kamu? Ganti peserta</button>
    </div>
    <AikoSays live pose={pose} figure={<Aiko3D pose={pose} enabled={aiko3d}/>}>{message}</AikoSays>
    <ol className="journey journey-live" aria-label="Langkah kegiatan">
      {stops.map(stop => <li key={stop.key} className={`stop ${stop.state}`} aria-current={stop.state === "now" ? "step" : undefined}>
        <span className={`stop-token${stop.art && stop.state !== "done" && stop.state !== "wait" ? " art" : ""}`} aria-hidden="true">{stop.state === "done" ? <Check size={26} strokeWidth={3}/> : stop.state === "wait" ? <LockKeyhole size={22} strokeWidth={2.3}/> : stop.icon}</span>
        <div className="stop-body">
          <span className="stop-step">{stop.step}</span>
          <h2>{stop.title}</h2>
          <p className="stop-detail"><span className="sr-only">{stop.state === "done" ? "Selesai. " : stop.state === "now" ? "Sekarang. " : "Belum dibuka. "}</span>{stop.detail}</p>
          {stop.action}
        </div>
      </li>)}
    </ol>
    {postDone ? <div className="result-callout"><Trophy size={34} strokeWidth={2.2} aria-hidden="true"/><div><h2>Hasil belajarmu sudah siap</h2><p>Lihat nilai dan pembahasan setiap soal.</p></div><button className="button sun big" onClick={onResults}>Lihat hasil belajarku<ArrowRight size={20} strokeWidth={2.5}/></button></div> : null}
  </section>;
}

export function Instructions({ kind, onStart, onBack }: { kind: TestKind; onStart: () => void; onBack: () => void }) {
  const [practice, setPractice] = useState<number | null>(null);
  return <section className="instructions-layout content-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={18}/> Kembali</button>
    <div className="instructions-heading"><p className="kicker">{kind === "pretest" ? "Pretest" : "Posttest"} · Sebelum mulai</p><h1>Latihan dulu, yuk!</h1></div>
    <AikoSays live pose={practice === null ? "thinking" : "wave"}>{practice === null ? "Klik salah satu jawaban di bawah. Latihan ini tidak dinilai." : "Nah, begitu caranya! Jawaban yang kamu pilih berubah biru. Kamu siap!"}</AikoSays>
    <div className="panel practice-panel">
      <span className="question-count">Soal latihan</span>
      <h2>Kamu siap belajar bersama?</h2>
      <div className="answer-list">{["Siap, ayo mulai!", "Siap, aku penasaran!"].map((option, index) => <button key={option} aria-pressed={practice === index} className={`answer-option ${practice === index ? "selected" : ""}`} onClick={() => setPractice(index)}><span className="option-letter">{index === 0 ? "A" : "B"}</span><span className="option-text">{option}</span><span className="option-check">{practice === index ? <Check size={18} strokeWidth={3}/> : null}</span></button>)}</div>
      <button className="button primary full-width big" disabled={practice === null} onClick={onStart}>Mulai {kind}<ArrowRight size={20} strokeWidth={2.5}/></button>
    </div>
    <ul className="rule-list">
      <li><Clock size={22} strokeWidth={2.3} aria-hidden="true"/>Tidak ada batas waktu</li>
      <li><RotateCcw size={22} strokeWidth={2.3} aria-hidden="true"/>Jawaban boleh diubah</li>
      <li><Send size={22} strokeWidth={2.3} aria-hidden="true"/>Kirim setelah 10 soal terjawab</li>
    </ul>
  </section>;
}

export function Completion({ kind, participant, aiko3d, onContinue }: { kind: TestKind; participant: Participant; aiko3d: boolean; onContinue: () => void }) {
  return <section className="completion-layout content-width">
    <div className="completion-art">
      <Aiko3D pose="celebrate" enabled={aiko3d}/>
      <span className="complete-tick"><Check size={30} strokeWidth={3}/></span>
    </div>
    <p className="kicker">{kind === "pretest" ? "Pretest selesai" : "Posttest selesai"}</p>
    <h1>Terima kasih, {participant.name}!</h1>
    <p className="completion-saved">Jawabanmu sudah terkirim dan tersimpan.</p>
    <div className="completion-note"><p>{kind === "pretest" ? "Sekarang kita belajar bersama. Nilai dan pembahasan bisa kamu lihat setelah posttest selesai." : "Kamu sudah menyelesaikan kedua tes. Yuk, lihat hasilmu."}</p></div>
    <button className={`button ${kind === "pretest" ? "primary" : "sun"} big`} onClick={onContinue}>{kind === "pretest" ? "Kembali ke petualanganku" : "Lihat hasil belajarku"}<ArrowRight size={20} strokeWidth={2.5}/></button>
  </section>;
}

// Pesan ditentukan dari nilai tes akhir dulu, baru dari perubahan. Selisih negatif tidak ditampilkan sebagai angka minus
// karena soal tes awal dan tes akhir berbeda (saran psikolog anak di council).
function resultMessage(pre: number, post: number) {
  if (post === 10) return "Sempurna! Semua jawabanmu tepat.";
  if (post >= 8) return "Keren! Kamu sudah paham banyak hal tentang AI.";
  if (post > pre) return "Ada hal baru yang kamu pahami!";
  return "Kamu sudah berusaha sampai selesai. Yuk, baca pembahasannya supaya makin paham.";
}

export function Results({ participant, results, aiko3d, onBack }: { participant: Participant; results: ResultData; aiko3d: boolean; onBack: () => void }) {
  const [kind, setKind] = useState<TestKind>("posttest");
  const pre = results.scores.pretest;
  const post = results.scores.posttest;
  const change = post - pre;
  const review = results.review?.[kind];
  return <section className="results-layout content-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={18}/> Kembali ke petualangan</button>
    <div className="result-summary">
      <div className="score-highlight">
        <BadgeCheck size={36} strokeWidth={2.2} aria-hidden="true"/>
        <span className="score-label">Tes akhir: jawaban tepat</span>
        <strong>{post}<small> dari 10</small></strong>
        <span>{resultMessage(pre, post)}</span>
      </div>
      <div className="results-heading">
        <p className="kicker">Kedua tes selesai</p>
        <h1>Ini hasil belajarmu, {participant.name}!</h1>
        <div className="score-bars" role="img" aria-label={`Tes awal ${pre} dari 10, tes akhir ${post} dari 10.`}>
          <div className="score-bar"><span className="score-bar-label">Tes awal</span><span className="score-bar-track"><span className="pre" style={{ width: `${pre * 10}%` }}/></span><strong>{pre}/10</strong></div>
          <div className="score-bar"><span className="score-bar-label">Tes akhir</span><span className="score-bar-track"><span className="post" style={{ width: `${post * 10}%` }}/></span><strong>{post}/10</strong></div>
        </div>
        <p className="score-change">{change > 0 ? <>Naik <strong>{change} poin</strong> dari tes awal. Hebat!</> : change === 0 ? "Nilaimu sama di kedua tes." : "Soal tes awal dan tes akhir berbeda, jadi nilainya tidak selalu naik. Yang penting, kamu tahu apa yang perlu dipelajari lagi."}</p>
      </div>
    </div>
    {results.review ? <>
      <AikoSays pose={post >= 8 || post > pre ? "celebrate" : "reassure"} figure={<Aiko3D pose={post >= 8 || post > pre ? "celebrate" : "reassure"} enabled={aiko3d}/>}>{post >= 8 || post > pre ? "Hebat! Yuk, baca pembahasannya untuk mengingat hal yang sudah kamu pahami." : "Tidak apa-apa! Baca pembahasannya pelan-pelan, nanti makin paham."}</AikoSays>
      <div className="review-heading"><div><h2>Yuk, pahami bersama</h2><p>Klik soal untuk membaca penjelasannya.</p></div><div className="segmented-control" role="group" aria-label="Pilih pembahasan">{(["pretest", "posttest"] as TestKind[]).map(test => <button key={test} aria-pressed={kind === test} className={kind === test ? "active" : ""} onClick={() => setKind(test)}>{test === "pretest" ? "Tes awal" : "Tes akhir"}</button>)}</div></div>
      <div className="explanation-list">{review!.questions.map((question, index) => {
        const answer = review!.answers[index];
        const correct = review!.correct[index];
        const right = answer === correct;
        return <details key={`${kind}-${question.id}`} className="panel explanation">
          <summary><span className="explanation-number">{index + 1}</span><span className="explanation-question">{question.text}</span><span className={`status-pill ${right ? "green" : "sun"}`}>{right ? <><CheckCircle2 size={15} strokeWidth={2.5}/>Tepat</> : <><BookOpen size={15} strokeWidth={2.5}/>Ayo pelajari</>}</span></summary>
          <div className="explanation-content">
            <p className={`answer-line ${right ? "right" : "wrong"}`}><span>Jawabanmu</span><strong>{question.options[answer]}</strong></p>
            {right ? null : <p className="answer-line right"><span>Jawaban tepat</span><strong>{question.options[correct]}</strong></p>}
            <div className="explanation-tip"><Lightbulb size={20} aria-hidden="true"/><p>{review!.explanations[index]}</p></div>
          </div>
        </details>;
      })}</div>
    </> : <AikoSays live pose="reading" figure={<Aiko3D pose="reading" enabled={aiko3d}/>}>Pembahasan soal akan muncul di sini setelah kakak pendamping menutup tes untuk semua teman. Tunggu sebentar, ya.</AikoSays>}
  </section>;
}
