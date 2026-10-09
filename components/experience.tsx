"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { blankAttempt, canStart, createStore, readStore, registerParticipant, STORAGE_KEY, type ClassName, type DemoStore, type Phase, type TestKind } from "@/lib/model";
import { Home } from "./home";
import { Join, StudentHub, Instructions, Completion, Results } from "./student";
import { Quiz } from "./quiz";
import { Admin } from "./admin";
import { Dialog } from "./dialog";
import { InstitutionHeader } from "./institution-header";

type Screen = "home" | "join" | "hub" | "intro" | "quiz" | "complete" | "results";

export function Experience({ admin = false }: { admin?: boolean }) {
  const [store, setStore] = useState<DemoStore>(createStore);
  const [screen, setScreen] = useState<Screen>("home");
  const [kind, setKind] = useState<TestKind>("pretest");
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [help, setHelp] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try { setStore(readStore(localStorage.getItem(STORAGE_KEY))); } catch { setSaved(false); }
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY) setStore(readStore(event.newValue)); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => { if (ready) { mainRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); } }, [screen, ready]);
  function commit(next: DemoStore) {
    setStore(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaved(true); } catch { setSaved(false); }
  }
  const participant = store.participants.find(item => item.code === store.activeCode);
  function join(name: string, className: ClassName) {
    const next = registerParticipant(store, name, className, crypto.randomUUID());
    if (next === store) return false;
    commit(next); setScreen("hub"); return true;
  }
  function start(test: TestKind) { if (participant && canStart(participant, store.phase, test)) { setKind(test); setScreen("intro"); } }
  function begin() {
    if (!participant || !canStart(participant, store.phase, kind)) { setScreen("hub"); return; }
    if (!participant[kind]) commit({ ...store, participants: store.participants.map(item => item.code === participant.code ? { ...item, [kind]: blankAttempt() } : item) });
    setScreen("quiz");
  }
  function answer(index: number, value: number) {
    if (!participant || !canStart(participant, store.phase, kind)) return;
    const attempt = participant[kind] ?? blankAttempt();
    commit({ ...store, participants: store.participants.map(item => item.code === participant.code ? { ...item, [kind]: { ...attempt, answers: attempt.answers.map((old, number) => number === index ? value : old) } } : item) });
  }
  function submit() {
    const attempt = participant?.[kind];
    if (!participant || !attempt || !canStart(participant, store.phase, kind) || attempt.answers.some(value => value === null)) return;
    commit({ ...store, participants: store.participants.map(item => item.code === participant.code ? { ...item, [kind]: { ...attempt, submittedAt: new Date().toISOString() } } : item) });
    setScreen("complete");
  }
  function changePhase(phase: Phase) { commit({ ...store, phase }); }
  const goStart = () => setScreen(participant ? "hub" : "join");
  const interrupted = participant && (screen === "quiz" || screen === "intro") && !canStart(participant, store.phase, kind);
  let content: React.ReactNode;
  if (admin) content = <Admin participants={store.participants} phase={store.phase} onPhase={changePhase}/>;
  else if (screen === "home") content = <Home onStart={goStart} returning={!!participant}/>;
  else if (screen === "join" || !participant) content = <Join onJoin={join} onBack={() => setScreen("home")}/>;
  else if (screen === "hub" || interrupted) content = <StudentHub participant={participant} phase={store.phase} onStart={start} onChange={() => { commit({ ...store, activeCode: null }); setScreen("join"); }} onResults={() => setScreen("results")}/>;
  else if (screen === "intro") content = <Instructions kind={kind} onStart={begin} onBack={() => setScreen("hub")}/>;
  else if (screen === "quiz") content = <Quiz participant={participant} kind={kind} saved={saved} onAnswer={answer} onSubmit={submit} onExit={() => setScreen("hub")}/>;
  else if (screen === "complete") content = <Completion kind={kind} participant={participant} saved={saved} onContinue={() => setScreen(kind === "pretest" ? "hub" : "results")}/>;
  else if (participant.posttest?.submittedAt) content = <Results participant={participant} onBack={() => setScreen("hub")}/>;
  else content = <StudentHub participant={participant} phase={store.phase} onStart={start} onChange={() => setScreen("join")} onResults={() => setScreen("hub")}/>;
  return <div className="app-shell"><a className="skip-link" href="#main">Langsung ke isi</a><InstitutionHeader admin={admin} onHelp={() => setHelp(true)} onHome={() => setScreen("home")}/>
    {!saved ? <div className="storage-warning" role="alert">Browser tidak dapat menyimpan data. Jawaban saat ini hanya ada di halaman ini dan bisa hilang ketika halaman ditutup.</div> : null}
    <main id="main" ref={mainRef} tabIndex={-1}>{ready ? content : <div className="loading-screen" role="status"><p>Menyiapkan kegiatan belajarmu...</p></div>}</main>
    <footer className="site-footer content-width"><span>PRODAMAT 2026 · Magister Informatika UAD</span><span>Pratinjau frontend · data tersimpan di browser ini</span></footer>
    {help ? <Dialog title="Aiko siap membantu!" onClose={() => setHelp(false)}><div className="help-content"><p><strong>Bagaimana cara mulai?</strong><br/>Klik “Mulai petualangan”, isi namamu dan pilih kelas. Gunakan nama dan kelas yang sama saat posttest agar hasilmu tersambung.</p><p><strong>Posttest masih terkunci?</strong><br/>Selesaikan pretest dulu. Pendamping akan membuka posttest setelah materi dan permainan.</p><p><strong>Perlu bantuan membaca soal?</strong><br/>Angkat tangan dan panggil kakak pendamping. Tidak perlu buru-buru.</p><div className="privacy-note"><ShieldCheck size={20}/><span>Ini pratinjau frontend. Jawaban tersimpan hanya di browser yang kamu gunakan.</span></div></div><button className="button primary full-width" onClick={() => setHelp(false)}>Oke, mengerti</button></Dialog> : null}
  </div>;
}

