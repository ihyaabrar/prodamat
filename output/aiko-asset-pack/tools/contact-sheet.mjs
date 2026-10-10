import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const base=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
let content='<rect width="1320" height="960" fill="#fbf9f3"/><rect width="1320" height="137" fill="#3158df"/><text x="48" y="65" font-size="40" font-weight="800" fill="#fff">Aiko — teman belajar di setiap langkah</text><text x="48" y="106" font-size="20" fill="#e2eaff">6 pose · SVG animasi · PNG transparan · model 3D dengan 6 gerakan</text>';
for(const[i,p]of manifest.robot.entries()){
 const x=40+(i%3)*420,y=166+Math.floor(i/3)*375,bg=i===2||i===4?'#fff4d6':i===5?'#e6f4ec':'#eef2ff';
 const png=(await readFile(new URL(p.png,base))).toString('base64');
 content+=`<rect x="${x}" y="${y}" width="400" height="350" rx="22" fill="${bg}"/><image href="data:image/png;base64,${png}" x="${x+80}" y="${y+8}" width="240" height="252"/><text x="${x+200}" y="${y+290}" text-anchor="middle" font-size="24" font-weight="800" fill="#1f2d44">${p.label}</text><text x="${x+200}" y="${y+321}" text-anchor="middle" font-size="15" fill="#4d5b6e">${p.id}</text>`;
}
content+='<text x="48" y="932" font-size="16" fill="#4d5b6e">Palet dan karakter mengikuti aplikasi AI di Sekitar Kita. Aset disimpan terpisah.</text>';
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1320" height="960"><g font-family="Arial,sans-serif">${content}</g></svg>`)).png().toFile(fileURLToPath(new URL('contact-sheet.png',base)));
console.log('contact-sheet.png ready');
