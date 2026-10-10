// Sertifikat partisipasi: nama dan nomor digambar di atas templat (public/sertifikat/templat.png, 1426x1103).
// Posisi diukur dari templat: garis nama y=509 (x 277-1152), garis nomor y=203 (x 1172-1354).

export const CERT = {
  src: "/sertifikat/templat.png",
  width: 1426,
  height: 1103,
  name: { centerX: 714, baseline: 494, maxWidth: 820, size: 56, minSize: 30 },
  number: { x: 1176, baseline: 199, maxWidth: 206, size: 18, minSize: 13 },
  ink: "#00265f",
  font: "CertSerif",
};

export type NumberGroup = { start: number; end: number; text: string };

// Semua deret angka di nomor pertama, misalnya "001/PRODAMAT/X/2026" -> ["001", "2026"].
export function numberGroups(first: string): NumberGroup[] {
  return [...first.matchAll(/\d+/g)].map(match => ({ start: match.index!, end: match.index! + match[0].length, text: match[0] }));
}

// Nomor ke-i: angka yang dipilih bertambah dan panjang nol di depannya dipertahankan; huruf dan tanda lain tetap.
export function nthNumber(first: string, groupIndex: number, offset: number): string {
  const group = numberGroups(first)[groupIndex];
  if (!group) return first;
  const next = String(Number(group.text) + offset).padStart(group.text.length, "0");
  return first.slice(0, group.start) + next + first.slice(group.end);
}

const LOWER = new Set(["bin", "binti", "al", "el", "van", "de"]);
export const tidyName = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID")
  .split(" ").map((word, index) => index > 0 && LOWER.has(word) ? word : word.replace(/^(\p{L})/u, letter => letter.toLocaleUpperCase("id-ID")).replace(/(['-])(\p{L})/gu, (_, mark, letter) => mark + letter.toLocaleUpperCase("id-ID"))).join(" ");

export type ImageFormat = "jpg" | "png";
export const fileName = (index: number, name: string, className: string, format: ImageFormat = "png") =>
  `${String(index + 1).padStart(3, "0")}_Kelas${className === "V" ? "5" : "6"}_${name.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "siswa"}.${format}`;

let assets: Promise<HTMLImageElement> | null = null;

// Templat dan font dimuat sekali, hanya saat tab sertifikat dibuka.
export function loadCertificateAssets() {
  assets ??= (async () => {
    const fonts = [
      new FontFace(CERT.font, "url(/sertifikat/fonts/playfair-display-latin-700-normal.woff2)", { weight: "700" }),
      new FontFace(CERT.font, "url(/sertifikat/fonts/playfair-display-latin-400-normal.woff2)", { weight: "400" }),
    ];
    for (const font of await Promise.all(fonts.map(font => font.load()))) document.fonts.add(font);
    const image = new Image();
    image.src = CERT.src;
    await image.decode();
    return image;
  })();
  assets.catch(() => { assets = null; });
  return assets;
}

// Nama memakai Playfair Display; nomor memakai serif biasa karena angka Playfair bergaya lama ("001" terbaca "oo1").
const NAME_FONT = `${CERT.font}, Georgia, serif`;
const NUMBER_FONT = `Georgia, "Noto Serif", "Times New Roman", serif`;

function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, minSize: number, maxWidth: number, family: string) {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (current > minSize && ctx.measureText(text).width > maxWidth) {
    current -= 1;
    ctx.font = `${weight} ${current}px ${family}`;
  }
}

// Mengembalikan false bila nama atau nomor tetap melebihi tempatnya pada ukuran huruf terkecil.
export function drawCertificate(canvas: HTMLCanvasElement, template: HTMLImageElement, name: string, number: string) {
  canvas.width = CERT.width;
  canvas.height = CERT.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(template, 0, 0, CERT.width, CERT.height);
  ctx.fillStyle = CERT.ink;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  fitText(ctx, name, 700, CERT.name.size, CERT.name.minSize, CERT.name.maxWidth, NAME_FONT);
  ctx.fillText(name, CERT.name.centerX, CERT.name.baseline);
  let fits = ctx.measureText(name).width <= CERT.name.maxWidth;
  if (number) {
    ctx.textAlign = "left";
    fitText(ctx, number, 400, CERT.number.size, CERT.number.minSize, CERT.number.maxWidth, NUMBER_FONT);
    ctx.fillText(number, CERT.number.x, CERT.number.baseline);
    fits &&= ctx.measureText(number).width <= CERT.number.maxWidth;
  }
  return fits;
}

// JPG kualitas 0,92 sekitar sepersepuluh ukuran PNG dan tetap tajam untuk dicetak.
export const canvasToImage = (canvas: HTMLCanvasElement, format: ImageFormat) => new Promise<Uint8Array>((resolve, reject) =>
  canvas.toBlob(blob => blob ? blob.arrayBuffer().then(buffer => resolve(new Uint8Array(buffer)), reject) : reject(new Error("Gagal membuat gambar")), format === "jpg" ? "image/jpeg" : "image/png", 0.92));

export function downloadBlob(data: BlobPart | Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data as BlobPart], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
