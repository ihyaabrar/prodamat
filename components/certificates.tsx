"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Download, FileArchive, RotateCcw } from "lucide-react";
import type { RekapParticipant } from "@/lib/model";
import { canvasToImage, drawCertificate, downloadBlob, fileName, loadCertificateAssets, nthNumber, numberGroups, tidyName, type ImageFormat } from "@/lib/certificate";

type Scope = "all" | "paired" | "V" | "VI";
type Override = { name?: string; number?: string };
const STORE = "prodamat.sertifikat.v1";
const DEFAULT_FIRST = "001/PRODAMAT-K2/X/2026";

// Pengaturan dan koreksi disimpan di browser pendamping ini saja, sebagai kemudahan saat membuka ulang tab.
function readSettings() {
  try { return JSON.parse(localStorage.getItem(STORE) ?? "{}") as { first?: string; group?: number; tidy?: boolean; overrides?: Record<string, Override> }; }
  catch { return {}; }
}

export function Certificates({ participants, sample }: { participants: RekapParticipant[]; sample: boolean }) {
  const [scope, setScope] = useState<Scope>("all");
  const [first, setFirst] = useState(DEFAULT_FIRST);
  const [group, setGroup] = useState(0);
  const [tidy, setTidy] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [template, setTemplate] = useState<HTMLImageElement | null>(null);
  const [assetError, setAssetError] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("jpg");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = readSettings();
    if (saved.first) setFirst(saved.first);
    if (typeof saved.group === "number") setGroup(saved.group);
    if (typeof saved.tidy === "boolean") setTidy(saved.tidy);
    if (saved.overrides) setOverrides(saved.overrides);
    setLoaded(true);
    loadCertificateAssets().then(setTemplate).catch(() => setAssetError("Templat sertifikat belum bisa dimuat. Periksa internet lalu buka tab ini lagi."));
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE, JSON.stringify({ first, group, tidy, overrides })); } catch {}
  }, [first, group, tidy, overrides, loaded]);

  const groups = numberGroups(first);
  const safeGroup = Math.min(group, Math.max(groups.length - 1, 0));
  const rows = useMemo(() => participants
    .filter(item => scope === "all" ? true : scope === "paired" ? item.scores.pretest !== null && item.scores.posttest !== null : item.className === scope)
    .sort((a, b) => a.className.localeCompare(b.className) || a.name.localeCompare(b.name, "id-ID"))
    .map((item, index) => ({
      code: item.code,
      className: item.className,
      name: overrides[item.code]?.name ?? (tidy ? tidyName(item.name) : item.name),
      number: overrides[item.code]?.number ?? (groups.length ? nthNumber(first, safeGroup, index) : first),
      edited: !!overrides[item.code],
    })), [participants, scope, overrides, tidy, first, safeGroup, groups.length]);
  const row = rows[Math.min(current, rows.length - 1)];

  useEffect(() => { if (template && row && canvasRef.current) setOverflow(!drawCertificate(canvasRef.current, template, row.name, row.number)); }, [template, row]);
  useEffect(() => { if (current > rows.length - 1) setCurrent(Math.max(rows.length - 1, 0)); }, [rows.length, current]);

  const edit = (code: string, change: Override) => setOverrides(previous => ({ ...previous, [code]: { ...previous[code], ...change } }));
  const resetRow = (code: string) => setOverrides(previous => { const next = { ...previous }; delete next[code]; return next; });

  async function exportOne() {
    if (!template || !row) return;
    const canvas = document.createElement("canvas");
    drawCertificate(canvas, template, row.name, row.number);
    downloadBlob(await canvasToImage(canvas, format), fileName(rows.indexOf(row), row.name, row.className, format), format === "jpg" ? "image/jpeg" : "image/png");
  }
  async function exportAll() {
    if (!template || !rows.length || progress) return;
    const { zipSync } = await import("fflate");
    const canvas = document.createElement("canvas");
    const files: Record<string, [Uint8Array, { level: 0 }]> = {};
    setProgress({ done: 0, total: rows.length });
    for (const [index, item] of rows.entries()) {
      drawCertificate(canvas, template, item.name, item.number);
      files[fileName(index, item.name, item.className, format)] = [await canvasToImage(canvas, format), { level: 0 }];
      setProgress({ done: index + 1, total: rows.length });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const list = rows.map((item, index) => `${index + 1}\t${item.number}\t${item.name}\tKelas ${item.className === "V" ? "5" : "6"}`).join("\r\n");
    files["daftar-nomor-sertifikat.txt"] = [new TextEncoder().encode(`No\tNomor sertifikat\tNama\tKelas\r\n${list}\r\n`), { level: 0 }];
    downloadBlob(zipSync(files), `sertifikat-prodamat-kelompok2${sample ? "-contoh" : ""}.zip`, "application/zip");
    setProgress(null);
  }

  if (!participants.length) return <div className="empty-table"><strong>Belum ada siswa terdaftar.</strong><p>Sertifikat dibuat otomatis dari nama siswa yang mendaftar di Beranda.</p></div>;
  return <div className="certificates">
    {sample ? <p className="analytics-note">Nama di bawah adalah data contoh.</p> : null}
    <div className="cert-settings">
      <label className="cert-field">Penerima
        <select value={scope} onChange={event => { setScope(event.target.value as Scope); setCurrent(0); }}>
          <option value="all">Semua siswa terdaftar ({participants.length})</option>
          <option value="paired">Menyelesaikan kedua tes ({participants.filter(item => item.scores.pretest !== null && item.scores.posttest !== null).length})</option>
          <option value="V">Kelas 5 ({participants.filter(item => item.className === "V").length})</option>
          <option value="VI">Kelas 6 ({participants.filter(item => item.className === "VI").length})</option>
        </select>
      </label>
      <label className="cert-field wide">Nomor sertifikat pertama
        <input value={first} spellCheck={false} onChange={event => { setFirst(event.target.value); setGroup(0); }}/>
      </label>
      <div className="cert-field wide">
        <span id="cert-group-label">Angka yang bertambah otomatis</span>
        {groups.length ? <div className="segmented-control cert-groups" role="group" aria-labelledby="cert-group-label">{groups.map((item, index) => <button key={`${item.start}-${item.text}`} aria-pressed={safeGroup === index} className={safeGroup === index ? "active" : ""} onClick={() => setGroup(index)}>{item.text}</button>)}</div>
          : <p className="field-hint">Nomor tidak berisi angka, jadi semua sertifikat memakai nomor yang sama. Ubah per siswa di tabel bila perlu.</p>}
        {groups.length ? <p className="field-hint">Contoh: {nthNumber(first, safeGroup, 0)}, {nthNumber(first, safeGroup, 1)}, {nthNumber(first, safeGroup, 2)}. Huruf dan tanda lain tetap sama; nomor tiap siswa tetap bisa diubah di tabel.</p> : null}
      </div>
      <label className="cert-check"><input type="checkbox" checked={tidy} onChange={event => setTidy(event.target.checked)}/>Rapikan huruf kapital nama (contoh: "rani ayu" menjadi "Rani Ayu")</label>
    </div>

    <div className="cert-preview">
      <div className="cert-preview-top">
        <p><strong>Pratinjau</strong> · sertifikat {rows.length ? Math.min(current, rows.length - 1) + 1 : 0} dari {rows.length}</p>
        <div className="cert-nav">
          <button className="icon-button" aria-label="Sertifikat sebelumnya" disabled={current <= 0} onClick={() => setCurrent(current - 1)}><ArrowLeft size={18}/></button>
          <button className="icon-button" aria-label="Sertifikat berikutnya" disabled={current >= rows.length - 1} onClick={() => setCurrent(current + 1)}><ArrowRight size={18}/></button>
        </div>
      </div>
      {assetError ? <p className="field-error" role="alert">{assetError}</p> : !template ? <p className="field-hint">Memuat templat sertifikat...</p> : rows.length ? <canvas ref={canvasRef} className="cert-canvas" role="img" aria-label={row ? `Sertifikat untuk ${row.name}, nomor ${row.number}` : "Sertifikat"}/> : <p className="field-hint">Tidak ada siswa pada pilihan penerima ini.</p>}
      {overflow ? <p className="dialog-warning" role="status">Nama atau nomor pada sertifikat ini terlalu panjang untuk tempatnya. Persingkat nomor atau nama di tabel.</p> : null}
      <div className="cert-format segmented-control" role="group" aria-label="Format gambar">{(["jpg", "png"] as ImageFormat[]).map(item => <button key={item} aria-pressed={format === item} className={format === item ? "active" : ""} onClick={() => setFormat(item)}>{item === "jpg" ? "JPG (ringan)" : "PNG (kualitas penuh)"}</button>)}</div>
      <div className="cert-actions">
        <button className="button secondary" disabled={!template || !row} onClick={exportOne}><Download size={18}/>Unduh {format.toUpperCase()} ini</button>
        <button className="button primary" disabled={!template || !rows.length || !!progress} onClick={exportAll}><FileArchive size={18}/>{progress ? `Membuat ${progress.done} dari ${progress.total}...` : `Unduh semua (${rows.length} sertifikat, ZIP)`}</button>
      </div>
      <p className="field-hint">ZIP berisi satu gambar per siswa (1426 x 1103 px) dan daftar nomor sertifikat. JPG sekitar 0,3 MB per sertifikat; PNG sekitar 2 MB.</p>
    </div>

    <div className="table-scroll"><table className="cert-table"><caption className="sr-only">Nama dan nomor sertifikat</caption><thead><tr><th>No</th><th>Nama di sertifikat</th><th>Kelas</th><th>Nomor sertifikat</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>
      {rows.map((item, index) => <tr key={item.code} className={index === current ? "current" : ""}>
        <td>{index + 1}</td>
        <td><input className="cert-input" aria-label={`Nama di sertifikat nomor ${index + 1}`} value={item.name} onChange={event => edit(item.code, { name: event.target.value })} onFocus={() => setCurrent(index)}/></td>
        <td>{item.className === "V" ? "5" : "6"}</td>
        <td><input className="cert-input number" aria-label={`Nomor sertifikat untuk ${item.name}`} value={item.number} onChange={event => edit(item.code, { number: event.target.value })} onFocus={() => setCurrent(index)}/></td>
        <td>{item.edited ? <button className="text-button" onClick={() => resetRow(item.code)}><RotateCcw size={15}/>Kembalikan</button> : <button className="text-button" onClick={() => setCurrent(index)}>Lihat</button>}</td>
      </tr>)}
    </tbody></table></div>
  </div>;
}
