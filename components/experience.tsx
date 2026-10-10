"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { blankAnswers, canStart, type ClassName, type Me, type PublicQuestion, type Results as ResultData, type TestKind } from "@/lib/model";
import { api, errorMessage, errorStatus } from "@/lib/api";
import { Home } from "./home";
import { Join, StudentHub, Instructions, Completion, Results } from "./student";
import { Quiz } from "./quiz";
import { AdminApp } from "./admin";
import { Dialog } from "./dialog";
import { InstitutionHeader } from "./institution-header";
import { StateMessage } from "./state-message";
import { Aiko, AikoIcon } from "./robot";

type Screen = "home" | "join" | "hub" | "intro" | "quiz" | "complete" | "results";
export type SaveState = "idle" | "saving" | "saved" | "error";
type PendingSave = { kind: TestKind; index: number; answer: number };
const POLL_MS = 8000;
const RETRY_DELAYS = [1000, 2000, 4000];

export function Experience({ admin = false }: { admin?: boolean }) {
  const [help, setHelp] = useState(false);
  const [home, setHome] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  return <div className="app-shell"><a className="skip-link" href="#main">Langsung ke isi</a><InstitutionHeader admin={admin} onHelp={() => setHelp(true)} onHome={() => setHome(value => value + 1)}/>
    <main id="main" ref={mainRef} tabIndex={-1}>{admin ? <AdminApp/> : <StudentApp mainRef={mainRef} homeSignal={home}/>}</main>
    <footer className="site-footer content-width"><span>PRODAMAT 2026 · Magister Informatika UAD</span><span>Jawaban tersimpan di server kegiatan</span></footer>
    {help ? <Dialog title="Aiko siap membantu!" onClose={() => setHelp(false)}><Aiko pose="idle" className="help-aiko"/><div className="help-content"><p><strong>Bagaimana cara mulai?</strong><br/>Klik “Mulai petualangan”, isi namamu dan pilih kelas. Gunakan nama dan kelas yang sama saat posttest agar hasilmu tersambung.</p><p><strong>Posttest masih terkunci?</strong><br/>Selesaikan pretest dulu. Pendamping akan membuka posttest setelah materi dan permainan.</p><p><strong>Perlu bantuan membaca soal?</strong><br/>Angkat tangan dan panggil kakak pendamping. Tidak perlu buru-buru.</p><div className="privacy-note"><AikoIcon name="safe-data"/><span>Yang disimpan hanya nama, kelas, dan jawabanmu. Tidak perlu email atau kata sandi.</span></div></div><button className="button primary full-width" onClick={() => setHelp(false)}>Oke, mengerti</button></Dialog> : null}
  </div>;
}

function StudentApp({ mainRef, homeSignal }: { mainRef: React.RefObject<HTMLElement | null>; homeSignal: number }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState("");
  const [questions, setQuestions] = useState<Record<TestKind, PublicQuestion[]> | null>(null);
  const [questionsError, setQuestionsError] = useState("");
  const [results, setResults] = useState<ResultData | null>(null);
  const [resultsError, setResultsError] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [kind, setKind] = useState<TestKind>("pretest");
  const [save, setSave] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  // Jawaban yang belum dikonfirmasi server, satu entri per soal. Dikirim satu per satu agar urutan di server sama dengan urutan klik.
  const queue = useRef(new Map<string, PendingSave>());
  const flushing = useRef(false);
  const view = useRef({ screen, kind });
  useEffect(() => { view.current = { screen, kind }; }, [screen, kind]);
  const signedIn = useRef(false);
  useEffect(() => { signedIn.current = !!me?.participant; }, [me?.participant]);

  // Saat sedang mengerjakan soal, jawaban lokal dipertahankan agar sinkron berkala tidak menimpa pilihan yang sedang disimpan.
  const load = useCallback(async () => {
    try {
      const next = await api<Me>("/api/peserta/saya");
      // Pendamping menghapus data siswa ini atau memulai sesi baru.
      if (signedIn.current && !next.participant) { setNotice("Kakak pendamping sedang menyiapkan ulang kegiatan. Tulis lagi nama dan kelasmu, ya."); setScreen("join"); }
      setMe(previous => {
        const { screen: current, kind: test } = view.current;
        const local = previous?.participant?.[test];
        if (current !== "quiz" || !local || !next.participant || next.participant.code !== previous?.participant?.code) return next;
        return { ...next, participant: { ...next.participant, [test]: { answers: local.answers, submittedAt: next.participant[test]?.submittedAt ?? null } } };
      });
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (homeSignal) setScreen("home"); }, [homeSignal]);
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible" && view.current.screen !== "home") void load(); };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load]);
  useEffect(() => { if (me && screen !== "quiz") { mainRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); } }, [screen, !!me]); // eslint-disable-line react-hooks/exhaustive-deps

  const participant = me?.participant ?? null;
  const phase = me?.phase ?? "pretest";

  const loadQuestions = useCallback(() => {
    setQuestionsError("");
    api<Record<TestKind, PublicQuestion[]>>("/api/soal").then(setQuestions).catch(error => { if (errorStatus(error) === 0 || errorStatus(error) >= 500) setQuestionsError(errorMessage(error)); else handleError(error); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const loadResults = useCallback(() => {
    setResultsError("");
    api<ResultData>("/api/hasil").then(setResults).catch(error => { if (errorStatus(error) === 0 || errorStatus(error) >= 500) setResultsError(errorMessage(error)); else handleError(error); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (participant && !questions && (screen === "intro" || screen === "quiz")) loadQuestions();
  }, [participant?.code, screen]); // eslint-disable-line react-hooks/exhaustive-deps
  // Hasil diambil ulang saat tahap berubah, supaya pembahasan muncul sendiri begitu pendamping menutup sesi.
  useEffect(() => {
    if (screen === "results" && participant?.posttest?.submittedAt) loadResults();
  }, [screen, participant?.posttest?.submittedAt, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pendamping menutup tes yang sedang dikerjakan: kembali ke halaman petualangan dengan penjelasan.
  useEffect(() => {
    if (!participant || (screen !== "quiz" && screen !== "intro") || canStart(participant, phase, kind)) return;
    if (!participant[kind]?.submittedAt && participant[kind]?.answers.some(answer => answer !== null)) setNotice(`Kakak pendamping menutup ${kind} untuk sementara. Jawaban yang sudah kamu pilih tetap tersimpan.`);
    setScreen("hub");
  }, [participant, phase, screen, kind]);

  useEffect(() => {
    const online = () => { if (queue.current.size) void flush(); };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleError(error: unknown) {
    const status = errorStatus(error);
    setNotice(errorMessage(error));
    if (status === 401) { setMe(previous => previous && { ...previous, participant: null }); setScreen("join"); }
    else if (status === 409 || status === 403) { void load(); setScreen("hub"); }
  }

  async function join(name: string, className: ClassName) {
    try {
      const next = await api<Me>("/api/peserta", { method: "POST", body: { name, className } });
      setMe(next); setResults(null); setNotice(""); setScreen("hub");
      return null;
    } catch (error) { return errorMessage(error); }
  }
  async function changeParticipant() {
    try {
      await api("/api/peserta/saya", { method: "DELETE" });
      queue.current.clear(); setSave("idle");
      setMe(previous => previous && { ...previous, participant: null }); setResults(null); setScreen("join");
    } catch (error) { setNotice(errorMessage(error)); }
  }
  function start(test: TestKind) { if (participant && canStart(participant, phase, test)) { setKind(test); setScreen("intro"); } }
  function begin() { setScreen(participant && canStart(participant, phase, kind) ? "quiz" : "hub"); }

  // Jawaban dari server, ditimpa pilihan lokal yang masih antre agar layar selalu menunjukkan klik terakhir anak.
  function applyServerAnswers(test: TestKind, answers: (number | null)[]) {
    const merged = [...answers];
    for (const item of queue.current.values()) if (item.kind === test) merged[item.index] = item.answer;
    setMe(previous => previous?.participant ? { ...previous, participant: { ...previous.participant, [test]: { answers: merged, submittedAt: null } } } : previous);
  }

  async function flush() {
    if (flushing.current) return;
    flushing.current = true;
    let retries = 0;
    setSave("saving");
    try {
      while (queue.current.size) {
        const [key, change] = queue.current.entries().next().value!;
        try {
          const { answers } = await api<{ answers: (number | null)[] }>("/api/jawaban", { method: "PUT", body: change });
          retries = 0;
          if (queue.current.get(key) === change) queue.current.delete(key);
          applyServerAnswers(change.kind, answers);
        } catch (error) {
          const status = errorStatus(error);
          if (status === 0 || status >= 500) {
            if (retries < RETRY_DELAYS.length) { await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retries++])); continue; }
            setSave("error");
            return;
          }
          queue.current.clear(); setSave("idle"); handleError(error);
          return;
        }
      }
      setSave("saved");
    } finally {
      flushing.current = false;
    }
  }
  function answer(index: number, value: number) {
    if (!participant || !canStart(participant, phase, kind)) return;
    const attempt = participant[kind] ?? { answers: blankAnswers(), submittedAt: null };
    setMe({ phase, participant: { ...participant, [kind]: { ...attempt, answers: attempt.answers.map((old, number) => number === index ? value : old) } } });
    queue.current.set(`${kind}:${index}`, { kind, index, answer: value });
    void flush();
  }
  async function submit() {
    if (submitting || save === "saving" || save === "error" || queue.current.size) return;
    setSubmitting(true);
    try {
      setMe(await api<Me>("/api/kirim", { method: "POST", body: { kind } }));
      setSave("idle"); setScreen("complete");
    } catch (error) { handleError(error); }
    finally { setSubmitting(false); }
  }

  const goStart = () => setScreen(participant ? "hub" : "join");
  let content: React.ReactNode;
  if (!me) content = loadError ? <StateMessage title="Halaman belum bisa dimuat." detail={loadError} onRetry={load}/> : <StateMessage title="Menyiapkan kegiatan belajarmu..."/>;
  else if (screen === "home") content = <Home onStart={goStart} returning={!!participant}/>;
  else if (screen === "join" || !participant) content = <Join onJoin={join} onBack={() => setScreen("home")}/>;
  else if (screen === "hub") content = <StudentHub participant={participant} phase={phase} onStart={start} onChange={changeParticipant} onResults={() => setScreen("results")}/>;
  else if (screen === "intro") content = <Instructions kind={kind} onStart={begin} onBack={() => setScreen("hub")}/>;
  else if (screen === "quiz") content = questions ? <Quiz participant={participant} kind={kind} questions={questions[kind]} save={save} submitting={submitting} onRetry={() => void flush()} onAnswer={answer} onSubmit={submit} onExit={() => setScreen("hub")}/> : questionsError ? <StateMessage title="Soal belum bisa dimuat." detail={questionsError} onRetry={loadQuestions}/> : <StateMessage title="Menyiapkan soal..."/>;
  else if (screen === "complete") content = <Completion kind={kind} participant={participant} onContinue={() => setScreen(kind === "pretest" ? "hub" : "results")}/>;
  else if (participant.posttest?.submittedAt) content = results ? <Results participant={participant} results={results} onBack={() => setScreen("hub")}/> : resultsError ? <StateMessage title="Hasil belum bisa dimuat." detail={resultsError} onRetry={loadResults}/> : <StateMessage title="Menyiapkan hasil belajarmu..."/>;
  else content = <StudentHub participant={participant} phase={phase} onStart={start} onChange={changeParticipant} onResults={() => setScreen("hub")}/>;
  return <>
    {notice ? <div className="notice-bar" role="alert"><p>{notice}</p><button className="icon-button" aria-label="Tutup pesan" onClick={() => setNotice("")}><X size={18}/></button></div> : null}
    {loadError && me ? <div className="notice-bar" role="status"><p>Koneksi terputus. Tahap kegiatan akan diperbarui saat tersambung lagi.</p></div> : null}
    {content}
  </>;
}
