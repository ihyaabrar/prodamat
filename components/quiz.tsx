"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleAlert, LoaderCircle, RotateCcw, Send } from "lucide-react";
import type { Participant, PublicQuestion, TestKind } from "@/lib/model";
import { Dialog } from "./dialog";
import type { SaveState } from "./experience";

export function Quiz({ participant, kind, questions, save, submitting, onRetry, onAnswer, onSubmit, onExit }: {
  participant: Participant; kind: TestKind; questions: PublicQuestion[]; save: SaveState; submitting: boolean; onRetry: () => void;
  onAnswer: (question: number, answer: number) => void; onSubmit: () => void; onExit: () => void;
}) {
  const answers = participant[kind]?.answers ?? Array<number | null>(10).fill(null);
  const [index, setIndex] = useState(() => { const first = answers.findIndex(answer => answer === null); return first < 0 ? 0 : first; });
  const [review, setReview] = useState(false);
  const headingRef = useRef<HTMLLegendElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [index]);
  const question = questions[index];
  const answered = answers.filter(answer => answer !== null).length;
  const navigate = (next: number) => { setIndex(next); setReview(false); };
  return <section className="quiz-layout content-width">
    <div className="quiz-top">
      <button className="text-button" onClick={onExit}><ArrowLeft size={18}/> Simpan & keluar</button>
      <h1 className="quiz-title">{kind === "pretest" ? "Pretest" : "Posttest"}<span> · {participant.name}</span></h1>
    </div>
    <div className="quiz-card" key={`${kind}-${index}`}>
      <div className="card-progress"><p className="question-count">Soal {index + 1} <span>dari 10</span></p><div className="progress-track" role="progressbar" aria-label="Soal terjawab" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={10}><span style={{ width: `${answered * 10}%` }}/></div></div>
      <fieldset className="question-fieldset">
        <legend ref={headingRef} tabIndex={-1}>{question.text}</legend>
        <p className="question-instruction">Pilih satu jawaban yang menurutmu paling tepat.</p>
        <div className="answer-list">{question.options.map((option, answer) => <label key={option} className={`answer-option ${answers[index] === answer ? "selected" : ""}`}><input type="radio" name={`question-${kind}-${index}`} value={answer} checked={answers[index] === answer} onChange={() => onAnswer(index, answer)}/><span className="option-letter">{String.fromCharCode(65 + answer)}</span><span className="option-text">{option}</span><span className="option-check">{answers[index] === answer ? <Check size={18} strokeWidth={3}/> : null}</span></label>)}</div>
      </fieldset>
    </div>
    <div className="quiz-navigation">
      <button className="button secondary" disabled={index === 0} onClick={() => navigate(index - 1)}><ArrowLeft size={20} strokeWidth={2.5}/> Kembali</button>
      <span className={`save-label ${save === "error" ? "unsaved" : ""}`} role="status">{save === "saving" ? <><LoaderCircle size={16} className="spin"/>Menyimpan...</> : save === "error" ? <><CircleAlert size={16}/>Gagal menyimpan<button className="retry-link" onClick={onRetry}><RotateCcw size={14}/>Coba lagi</button></> : save === "saved" ? <><CheckCircle2 size={16}/>Tersimpan</> : <><CheckCircle2 size={16}/>Jawaban tersimpan otomatis</>}</span>
      {index < 9 ? <button className="button primary big" disabled={answers[index] === null} onClick={() => navigate(index + 1)}>Lanjut<ArrowRight size={20} strokeWidth={2.5}/></button> : <button className="button sun big" onClick={() => setReview(true)}>Periksa jawaban<CheckCircle2 size={20} strokeWidth={2.5}/></button>}
    </div>
    {answers[index] === null && index < 9 ? <p className="quiz-hint">Pilih satu jawaban dulu untuk lanjut. Belum yakin? Pilih yang menurutmu paling tepat.</p> : null}
    <nav className="question-map" aria-label="Nomor soal">
      <p className="map-title">Lompat ke soal</p>
      <div className="question-dots">{answers.map((answer, number) => <button key={number} className={`question-dot ${answer !== null ? "answered" : ""} ${index === number ? "current" : ""}`} aria-label={`Soal ${number + 1}, ${answer === null ? "belum dijawab" : "sudah dijawab"}`} aria-current={index === number ? "step" : undefined} onClick={() => navigate(number)}>{number + 1}</button>)}</div>
      <p className="map-count"><strong>{answered}</strong> dari 10 soal terjawab</p>
    </nav>
    {review ? <Dialog title={answered === 10 ? "Siap mengirim jawaban?" : "Yuk, lengkapi dulu!"} onClose={() => setReview(false)}>
      <p>{answered === 10 ? save === "error" ? "Ada jawaban yang belum tersimpan. Tutup jendela ini lalu klik Coba lagi di bawah soal." : "Kamu sudah menjawab 10 soal. Setelah dikirim, jawaban tidak bisa diubah lagi." : `Masih ada ${10 - answered} soal yang belum dijawab. Nomor berwarna kuning belum dijawab. Klik nomornya untuk melengkapi.`}</p>
      <div className="review-numbers">{answers.map((answer, number) => <button key={number} className={`question-dot ${answer !== null ? "answered" : "missing"}`} onClick={() => navigate(number)} aria-label={`Buka soal ${number + 1}, ${answer === null ? "belum dijawab" : "sudah dijawab"}`}>{number + 1}</button>)}</div>
      <div className="modal-actions"><button className="button secondary" onClick={() => setReview(false)}>Periksa lagi</button><button className="button primary" disabled={answered !== 10 || submitting || save === "saving" || save === "error"} onClick={onSubmit}>{submitting ? "Mengirim..." : save === "saving" ? "Menyimpan..." : <>Kirim jawaban<Send size={18}/></>}</button></div>
    </Dialog> : null}
  </section>;
}
