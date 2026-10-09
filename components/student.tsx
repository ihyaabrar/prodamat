"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock, Lightbulb, LockKeyhole, RotateCcw, Search, Send, ShieldCheck, Trophy, ClipboardCheck, ClipboardList } from "lucide-react";
import { canStart, validName, type ClassName, type Participant, type Phase, type Results as ResultData, type TestKind } from "@/lib/model";
import { AikoSays, Robot } from "./robot";

const classLabel = (className: ClassName) => className === "V" ? "5" : "6";

export function Join({ onJoin, onBack }: { onJoin: (name: string, className: ClassName) => Promise<string | null>; onBack: () => void }) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState<ClassName | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  return <section className="student-layout join-layout content-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={18}/> Kembali ke beranda</button>
    <h1 className="join-title">Kenalan dulu, yuk!</h1>
    <AikoSays wave>Tulis namamu, lalu pilih kelasmu. Tidak perlu email atau kata sandi.</AikoSays>
    <form className="panel join-panel" onSubmit={async event => { event.preventDefault(); if (sending) return; if (!className || !validName(name)) { setError("Tulis nama minimal 2 huruf dan pilih kelasmu, ya."); return; } setSending(true); const problem = await onJoin(name, className); setSending(false); if (problem) setError(problem); }}>
      <label className="field-label" htmlFor="participant-name"><span className="field-number" aria-hidden="true">1</span>Nama lengkapmu</label>
      <input id="participant-name" className="name-input" placeholder="Tulis nama lengkapmu" value={name} maxLength={60} required minLength={2} autoComplete="off" autoCapitalize="words" spellCheck={false} aria-describedby={error ? "name-error name-hint" : "name-hint"} aria-invalid={!!error} onChange={event => { setName(event.target.value); setError(""); }}/>
      <p className="field-hint" id="name-hint">Pakai nama yang sama saat pretest dan posttest, ya.</p>
      <fieldset className="class-options">
        <legend className="field-label"><span className="field-number" aria-hidden="true">2</span>Kelasmu</legend>
        {(["V", "VI"] as ClassName[]).map(value => <label className={className === value ? "selected" : ""} key={value}>
          <input type="radio" name="class" value={value} required checked={className === value} onChange={() => { setClassName(value); setError(""); }}/>
          <span className="class-number">{classLabel(value)}</span><span className="class-name">Kelas {classLabel(value)}<small>Kelas {value}</small></span>
          <span className="option-check">{className === value ? <Check size={18} strokeWidth={3}/> : null}</span>
        </label>)}
      </fieldset>
      {error ? <p id="name-error" className="field-error" role="alert">{error}</p> : null}
      <button className="button primary full-width big" disabled={!validName(name) || !className || sending} type="submit">{sending ? "Sebentar, ya..." : <>Ayo masuk<ArrowRight size={20} strokeWidth={2.5}/></>}</button>
      <p className="privacy-note"><ShieldCheck size={18} aria-hidden="true"/><span>Nama dan kelas dipakai untuk menyambungkan hasil pretest dan posttest-mu.</span></p>
    </form>
  </section>;
}

type StopState = "done" | "now" | "wait";
type Stop = { key: string; title: string; step: string; icon: React.ReactNode; state: StopState; detail: string; action?: React.ReactNode };

export function StudentHub({ participant, phase, onStart, onChange, onResults }: { participant: Participant; phase: Phase; onStart: (kind: TestKind) => void; onChange: () => void; onResults: () => void }) {
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
    { key: "learning", title: "Jadi Detektif AI", step: "Langkah 2 · Belajar", icon: <Search size={24} strokeWidth={2.3}/>, state: learningState, detail: learningState === "now" ? "Sekarang! Dengarkan kakak pendamping." : learningState === "done" ? "Materi dan permainan selesai." : preDone ? "Tunggu kakak pendamping memulainya." : "Dimulai setelah pretest." },
    { key: "posttest", title: "Posttest", step: "Langkah 3 · Setelah belajar", icon: <ClipboardCheck size={24} strokeWidth={2.3}/>, ...testStop("posttest") },
  ];
  const message = postDone ? "Hebat! Kedua tes sudah selesai. Yuk, lihat hasil belajarmu."
    : canStart(participant, phase, "pretest") ? answered("pretest") ? "Kamu sudah mulai pretest. Ayo lanjutkan dari soal yang belum dijawab." : "Pertama, kerjakan pretest. Jawab sesuai yang kamu tahu, ya."
    : canStart(participant, phase, "posttest") ? "Posttest sudah dibuka! Tunjukkan hal baru yang kamu pelajari."
    : phase === "learning" ? "Waktunya jadi Detektif AI! Ikuti materi dan permainan bersama kakak pendamping."
    : phase === "closed" ? "Kegiatan hari ini sudah selesai. Terima kasih sudah belajar!"
    : phase === "posttest" && !preDone ? "Posttest bisa dikerjakan setelah pretest. Angkat tangan dan panggil kakak pendamping, ya."
    : "Pretest selesai! Tunggu kakak pendamping memulai kegiatan berikutnya.";
  return <section className="student-layout content-width">
    <div className="hub-heading">
      <div><p className="kicker">Kelas {classLabel(participant.className)} · Petualangan belajarmu</p><h1>Halo, {participant.name}!</h1></div>
      <button className="text-button" onClick={onChange}><RotateCcw size={17}/> Bukan kamu? Ganti peserta</button>
    </div>
    <AikoSays live>{message}</AikoSays>
    <ol className="journey journey-live" aria-label="Langkah kegiatan">
      {stops.map(stop => <li key={stop.key} className={`stop ${stop.state}`} aria-current={stop.state === "now" ? "step" : undefined}>
        <span className="stop-token" aria-hidden="true">{stop.state === "done" ? <Check size={26} strokeWidth={3}/> : stop.state === "wait" ? <LockKeyhole size={22} strokeWidth={2.3}/> : stop.icon}</span>
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
    <AikoSays live>{practice === null ? "Klik salah satu jawaban di bawah. Latihan ini tidak dinilai." : "Nah, begitu caranya! Jawaban yang kamu pilih berubah biru. Kamu siap!"}</AikoSays>
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

const burst = Array.from({ length: 14 }, (_, index) => {
  const angle = index / 14 * Math.PI * 2;
  const distance = 120 + (index % 3) * 34;
  return { x: Math.round(Math.cos(angle) * distance), y: Math.round(Math.sin(angle) * distance * .8), tone: ["blue", "sun", "green"][index % 3], delay: (index % 4) * 40 };
});

export function Completion({ kind, participant, onContinue }: { kind: TestKind; participant: Participant; onContinue: () => void }) {
  return <section className="completion-layout content-width">
    <div className="completion-art">
      <div className="burst" aria-hidden="true">{burst.map((piece, index) => <span key={index} className={piece.tone} style={{ "--x": `${piece.x}px`, "--y": `${piece.y}px`, animationDelay: `${piece.delay}ms` } as React.CSSProperties}/>)}</div>
      <Robot wave/>
      <span className="complete-tick"><Check size={30} strokeWidth={3}/></span>
    </div>
    <p className="kicker">{kind === "pretest" ? "Pretest selesai" : "Posttest selesai"}</p>
    <h1>Terima kasih, {participant.name}!</h1>
    <p className="completion-saved">Jawabanmu sudah terkirim dan tersimpan.</p>
    <div className="completion-note"><p>{kind === "pretest" ? "Sekarang kita belajar bersama. Nilai dan pembahasan bisa kamu lihat setelah posttest selesai." : "Apa pun hasilnya, terus bertanya dan berpikir sendiri. Yuk, lihat apa yang sudah kamu pahami."}</p></div>
    <button className={`button ${kind === "pretest" ? "primary" : "sun"} big`} onClick={onContinue}>{kind === "pretest" ? "Kembali ke petualanganku" : "Lihat hasil belajarku"}<ArrowRight size={20} strokeWidth={2.5}/></button>
  </section>;
}

export function Results({ participant, results, onBack }: { participant: Participant; results: ResultData; onBack: () => void }) {
  const [kind, setKind] = useState<TestKind>("posttest");
  const pre = results.pretest.score;
  const post = results.posttest.score;
  const change = post - pre;
  return <section className="results-layout content-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={18}/> Kembali ke petualangan</button>
    <div className="result-summary">
      <div className="score-highlight">
        <Trophy size={34} strokeWidth={2.2} aria-hidden="true"/>
        <span className="score-label">Nilai posttest</span>
        <strong>{post}<small>/10</small></strong>
        <span>{post > pre ? "Ada hal baru yang kamu pahami!" : "Terus belajar, ya. Kamu pasti bisa!"}</span>
      </div>
      <div className="results-heading">
        <p className="kicker">Kedua tes selesai</p>
        <h1>Ini hasil belajarmu, {participant.name}!</h1>
        <div className="score-bars" role="img" aria-label={`Pretest ${pre} dari 10, posttest ${post} dari 10, perubahan ${change > 0 ? "naik" : change < 0 ? "turun" : "tetap"} ${Math.abs(change)} poin.`}>
          <div className="score-bar"><span className="score-bar-label">Pretest</span><span className="score-bar-track"><span className="pre" style={{ width: `${pre * 10}%` }}/></span><strong>{pre}/10</strong></div>
          <div className="score-bar"><span className="score-bar-label">Posttest</span><span className="score-bar-track"><span className="post" style={{ width: `${post * 10}%` }}/></span><strong>{post}/10</strong></div>
        </div>
        <p className="score-change">Perubahan: <strong>{change > 0 ? "+" : ""}{change} poin</strong></p>
      </div>
    </div>
    <div className="review-heading"><div><h2>Yuk, pahami bersama</h2><p>Klik soal untuk membaca penjelasannya.</p></div><div className="segmented-control" role="group" aria-label="Pilih pembahasan">{(["pretest", "posttest"] as TestKind[]).map(test => <button key={test} aria-pressed={kind === test} className={kind === test ? "active" : ""} onClick={() => setKind(test)}>{test === "pretest" ? "Pretest" : "Posttest"}</button>)}</div></div>
    <div className="explanation-list">{results[kind].questions.map((question, index) => {
      const answer = results[kind].answers[index];
      const correct = results[kind].correct[index];
      const right = answer === correct;
      return <details key={`${kind}-${question.id}`} className="panel explanation">
        <summary><span className="explanation-number">{index + 1}</span><span className="explanation-question">{question.text}</span><span className={`status-pill ${right ? "green" : "sun"}`}>{right ? <><CheckCircle2 size={15} strokeWidth={2.5}/>Tepat</> : <><BookOpen size={15} strokeWidth={2.5}/>Ayo pelajari</>}</span></summary>
        <div className="explanation-content">
          <p className={`answer-line ${right ? "right" : "wrong"}`}><span>Jawabanmu</span><strong>{question.options[answer]}</strong></p>
          {right ? null : <p className="answer-line right"><span>Jawaban tepat</span><strong>{question.options[correct]}</strong></p>}
          <div className="explanation-tip"><Lightbulb size={20} aria-hidden="true"/><p>{results[kind].explanations[index]}</p></div>
        </div>
      </details>;
    })}</div>
  </section>;
}
