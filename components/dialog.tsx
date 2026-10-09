"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="icon-button modal-close" aria-label="Tutup" onClick={onClose}><X size={20}/></button>
    <h2 id={titleId}>{title}</h2>{children}
  </dialog>;
}
