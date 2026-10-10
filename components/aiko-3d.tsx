"use client";

import { useEffect, useRef, useState } from "react";
import type { AikoPose } from "@/lib/aiko-art";
import type { AikoEngine } from "@/lib/aiko3d/engine";
import { Aiko } from "./robot";

// Aiko 2D tampil lebih dulu; versi 3D dimuat saat browser senggang lalu muncul perlahan di tempat yang sama.
// Tetap 2D bila: saklar pendamping mati, kurangi gerak, hemat data, jaringan 2G, memori <= 2 GB, tanpa WebGL,
// atau render tersendat di 2 detik pertama (ditandai untuk sisa sesi browser).
const SLOW_KEY = "prodamat.aiko3d.lambat";

// ?aiko3d=paksa melewati pemeriksaan perangkat dan uji kelancaran, untuk meninjau; fps hasil ukur dicatat di console.
const forced = () => new URLSearchParams(location.search).get("aiko3d") === "paksa";

function eligible() {
  if (forced()) return true;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData || /2g$/.test(nav.connection?.effectiveType ?? "")) return false;
  if (nav.deviceMemory && nav.deviceMemory <= 2) return false;
  try { if (sessionStorage.getItem(SLOW_KEY)) return false; } catch {}
  return true;
}

// framing "bust": hanya kepala dan dada, dipotong tepi bawah wadah; tangan boleh keluar dari wadah (dipakai di Beranda).
export function Aiko3D({ pose, enabled, replay = 0, className = "", onTap, tapLabel = "Ketuk Aiko", framing = "full" }: { pose: AikoPose; enabled: boolean; replay?: number; className?: string; onTap?: () => void; tapLabel?: string; framing?: "full" | "bust" }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  const engine = useRef<AikoEngine | null>(null);
  const poseRef = useRef(pose);
  const [live, setLive] = useState(false);
  poseRef.current = pose;

  useEffect(() => {
    const element = layer.current;
    if (!enabled || !element || !eligible()) return;
    let cancelled = false;
    const start = () => import("@/lib/aiko3d/engine").then(({ getEngine, webglAvailable }) => {
      if (cancelled || !webglAvailable()) return;
      const instance = getEngine();
      engine.current = instance;
      const lost = () => { instance.unmount(element); engine.current = null; setLive(false); };
      instance.mount(element, forced() ? { framing, onLost: lost, onMeasure: fps => console.info(`Aiko 3D: ${fps} fps`) } : {
        framing,
        onLost: lost,
        onSlow: () => {
          try { sessionStorage.setItem(SLOW_KEY, "1"); } catch {}
          instance.unmount(element);
          engine.current = null;
          setLive(false);
        },
      });
      instance.play(poseRef.current);
      requestAnimationFrame(() => { if (!cancelled) setLive(true); });
    }).catch(() => {});
    const viaIdle = typeof window.requestIdleCallback === "function";
    const scheduled = viaIdle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 800);
    return () => {
      cancelled = true;
      if (viaIdle) window.cancelIdleCallback(scheduled); else window.clearTimeout(scheduled);
      engine.current?.unmount(element);
      engine.current = null;
      setLive(false);
    };
  }, [enabled, framing]);

  useEffect(() => { engine.current?.play(pose); }, [pose, replay]);

  // Berhenti merender saat Aiko keluar layar atau tab tidak aktif.
  useEffect(() => {
    const element = wrap.current;
    if (!element || !live) return;
    let visible = true;
    const update = () => engine.current?.pause(!visible || document.visibilityState !== "visible");
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [live]);

  // Kepala menoleh pelan ke arah kursor atau sentuhan (hanya Aiko yang bisa diketuk, yaitu di Beranda).
  useEffect(() => {
    if (!onTap || !live) return;
    const move = (event: PointerEvent) => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box) return;
      engine.current?.lookAt((event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2), (event.clientY - (box.top + box.height * 0.3)) / (window.innerHeight / 2));
    };
    window.addEventListener("pointermove", move);
    return () => { window.removeEventListener("pointermove", move); engine.current?.lookAt(0, 0); };
  }, [onTap, live]);

  return <span ref={wrap} className={`robot aiko3d${framing === "bust" ? " is-bust" : ""}${live ? " is-live" : ""}${className ? ` ${className}` : ""}`}>
    <Aiko pose={pose} className="aiko3d-fallback"/>
    <span ref={layer} className="aiko3d-layer" aria-hidden="true"/>
    {onTap ? <button type="button" className="aiko3d-tap" aria-label={tapLabel} onClick={onTap}/> : null}
  </span>;
}
