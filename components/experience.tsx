"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { blankAnswers, canStart, type ClassName, type Me, type PublicQuestion, type Results as ResultData, type TestKind } from "@/lib/model";
import { api, errorMessage, errorStatus } from "@/lib/api";
import { Home } from "./home";
import { Join, StudentHub, Instructions, Completion, Results } from "./student";
import { Quiz } from "./quiz";
import { AdminApp } from "./admin";
import { Dialog } from "./dialog";
import { InstitutionHeader } from "./institution-header";
import { StateMessage } from "./state-message";

type Screen = "home" | "join" | "hub" | "intro" | "quiz" | "complete" | "results";
export type SaveState = "idle" | "saving" | "saved" | "error";
type PendingSave = { kind: TestKind; index: number; answer: number };
const POLL_MS = 8000;

export function Experience({ admin = false }: { admin?: boolean }) {
  const [help, setHelp] = useState(false);
  const [home, setHome] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  return <div className="app-shell"><a className="skip-link" href="#main">Langsung ke isi</a><InstitutionHeader admin={admin} onHelp={() => setHelp(true)} onHome={() => setHome(value => value + 1)}/>
    <main id="main" ref={mainRef} tabIndex={-1}>{admin ? <AdminApp/> : <StudentApp mainRef={mainRef} homeSignal={home}/>}</main>
    <footer className="site-footer content-width"><span>PRODAMAT 2026 · Magister Informatika UAD</span><span>Jawaban tersimpan di server kegiatan</span></footer>
    {help ? <Dialog title="Aiko siap membantu!" onClose={() => setHelp(false)}><div className="help-content"><p><strong>Bagaimana cara mulai?</strong><br/>Klik “Mulai petualangan”, isi namamu dan pilih kelas. Gunakan nama dan kelas yang sama saat posttest agar hasilmu tersambung.</p><p><strong>Posttest masih terkunci?</strong><br/>Selesaikan pretest dulu. Pendamping akan membuka posttest setelah materi dan permainan.</p><p><strong>Perlu bantuan membaca soal?</strong><br/>Angkat tangan dan panggil kakak pendamping. Tidak perlu buru-buru.</p><div className="privacy-note"><ShieldCheck size={20}/><span>Yang disimpan hanya nama, kelas, dan jawabanmu. Tidak perlu email atau kata sandi.</span></div></div><button className="button primary full-width" onClick={() => setHelp(false)}>Oke, mengerti</button></Dialog> : null}
  </div>;
}

function StudentApp({ mainRef, homeSignal }: { mainRef: React.RefObject<HTMLElement | null>; homeSignal: number }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState("");
  const [questions, setQuestions] = useState<Record<TestKind, PublicQuestion[]> | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [kind, setKind] = useState<TestKind>("pretest");
  const [save, setSave] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef<PendingSave | null>(null);
  const saveSeq = useRef(0);
  const view = useRef({ screen, kind });
  useEffect(() => { view.current = { screen, kind }; }, [screen, kind]);

  // Saat sedang mengerjakan soal, jawaban lokal dipertahankan agar sinkron berkala tidak menimpa pilihan yang sedang disimpan.
  const load = useCallback(async () => {
    try {
      const next = await api<Me>("/api/peserta/saya");
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
  useEffect(() => { if (me) { mainRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); } }, [screen, !!me]); // eslint-disable-line react-hooks/exhaustive-deps

  const participant = me?.participant ?? null;
  const phase = me?.phase ?? "pretest";

  useEffect(() => {
    if (!participant || questions || (screen !== "intro" && screen !== "quiz")) return;
    api<Record<TestKind, PublicQuestion[]>>("/api/soal").then(setQuestions).catch(error => handleError(error));
  }, [participant?.code, screen]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (screen !== "results" || results || !participant?.posttest?.submittedAt) return;
    api<ResultData>("/api/hasil").then(setResults).catch(error => handleError(error));
  }, [screen, participant?.posttest?.submittedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setMe(previous => previous && { ...previous, participant: null }); setResults(null); setScreen("join");
    } catch (error) { setNotice(errorMessage(error)); }
  }
  function start(test: TestKind) { if (participant && canStart(participant, phase, test)) { setKind(test); setScreen("intro"); } }
  function begin() { setScreen(participant && canStart(participant, phase, kind) ? "quiz" : "hub"); }

  async function persist(change: PendingSave) {
    const id = ++saveSeq.current;
    pending.current = change;
    setSave("saving");
    try {
      const { answers } = await api<{ answers: (number | null)[] }>("/api/jawaban", { method: "PUT", body: change });
      if (id !== saveSeq.current) return;
      pending.current = null;
      setSave("saved");
      setMe(previous => previous?.participant ? { ...previous, participant: { ...previous.participant, [change.kind]: { answers, submittedAt: null } } } : previous);
    } catch (error) {
      if (id !== saveSeq.current) return;
      const status = errorStatus(error);
      if (status === 0 || status >= 500) { setSave("error"); return; }
      pending.current = null; setSave("idle"); handleError(error);
    }
  }
  function answer(index: number, value: number) {
    if (!participant || !canStart(participant, phase, kind)) return;
    const attempt = participant[kind] ?? { answers: blankAnswers(), submittedAt: null };
    setMe({ phase, participant: { ...participant, [kind]: { ...attempt, answers: attempt.answers.map((old, number) => number === index ? value : old) } } });
    void persist({ kind, index, answer: value });
  }
  async function submit() {
    if (submitting || save === "saving" || save === "error") return;
    setSubmitting(true);
    try {
      setMe(await api<Me>("/api/kirim", { method: "POST", body: { kind } }));
      setSave("idle"); setScreen("complete");
    } catch (error) { handleError(error); }
    finally { setSubmitting(false); }
  }

  const goStart = () => setScreen(participant ? "hub" : "join");
  const interrupted = participant && (screen === "quiz" || screen === "intro") && !canStart(participant, phase, kind);
  let content: React.ReactNode;
  if (!me) content = loadError ? <StateMessage title="Halaman belum bisa dimuat." detail={loadError} onRetry={load}/> : <StateMessage title="Menyiapkan kegiatan belajarmu..."/>;
  else if (screen === "home") content = <Home onStart={goStart} returning={!!participant}/>;
  else if (screen === "join" || !participant) content = <Join onJoin={join} onBack={() => setScreen("home")}/>;
  else if (screen === "hub" || interrupted) content = <StudentHub participant={participant} phase={phase} onStart={start} onChange={changeParticipant} onResults={() => setScreen("results")}/>;
  else if (screen === "intro") content = <Instructions kind={kind} onStart={begin} onBack={() => setScreen("hub")}/>;
  else if (screen === "quiz") content = questions ? <Quiz participant={participant} kind={kind} questions={questions[kind]} save={save} submitting={submitting} onRetry={() => pending.current && void persist(pending.current)} onAnswer={answer} onSubmit={submit} onExit={() => setScreen("hub")}/> : <StateMessage title="Menyiapkan soal..."/>;
  else if (screen === "complete") content = <Completion kind={kind} participant={participant} onContinue={() => setScreen(kind === "pretest" ? "hub" : "results")}/>;
  else if (participant.posttest?.submittedAt) content = results ? <Results participant={participant} results={results} onBack={() => setScreen("hub")}/> : <StateMessage title="Menyiapkan hasil belajarmu..."/>;
  else content = <StudentHub participant={participant} phase={phase} onStart={start} onChange={changeParticipant} onResults={() => setScreen("hub")}/>;
  return <>
    {notice ? <div className="notice-bar" role="alert"><p>{notice}</p><button className="icon-button" aria-label="Tutup pesan" onClick={() => setNotice("")}><X size={18}/></button></div> : null}
    {loadError && me ? <div className="notice-bar" role="status"><p>Koneksi terputus. Tahap kegiatan akan diperbarui saat tersambung lagi.</p></div> : null}
    {content}
  </>;
}

