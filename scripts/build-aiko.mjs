// Menyalin pose dan ikon Aiko dari paket aset (output/aiko-asset-pack) ke lib/aiko-art.ts.
// Jalankan ulang bila paket aset diperbarui: node scripts/build-aiko.mjs
import { readFile, readdir, writeFile } from "node:fs/promises";

const PACK = new URL("../output/aiko-asset-pack/svg/", import.meta.url);

// Teks di dalam SVG dibuang: gambar dipakai sebagai hiasan (aria-hidden), maknanya ada di gelembung Aiko.
const clean = svg => svg
  .replace(/\s(role|aria-labelledby)="[^"]*"/g, "")
  .replace(/<title[^>]*>.*?<\/title>/s, "")
  .replace(/<desc[^>]*>.*?<\/desc>/s, "")
  .replace("<svg ", '<svg aria-hidden="true" focusable="false" ');

async function collect(folder) {
  const entries = {};
  for (const file of (await readdir(new URL(folder, PACK))).filter(name => name.endsWith(".svg")).sort()) {
    entries[file.replace(/^aiko-/, "").replace(/\.svg$/, "")] = clean(await readFile(new URL(`${folder}/${file}`, PACK), "utf8"));
  }
  return entries;
}

const poses = await collect("animated");
const icons = await collect("icons");
const body = (name, entries) => `export const ${name} = {\n${Object.entries(entries).map(([key, svg]) => `  ${JSON.stringify(key)}: ${JSON.stringify(svg)},`).join("\n")}\n} as const;\n`;
await writeFile(new URL("../lib/aiko-art.ts", import.meta.url), `// Dibuat oleh scripts/build-aiko.mjs dari output/aiko-asset-pack. Jangan diedit manual.\n\n${body("aikoPoses", poses)}\n${body("aikoIcons", icons)}\nexport type AikoPose = keyof typeof aikoPoses;\nexport type AikoIcon = keyof typeof aikoIcons;\n`);
console.log("pose:", Object.keys(poses).join(", "), "| ikon:", Object.keys(icons).join(", "));
