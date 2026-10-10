import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json','.glb':'model/gltf-binary','.md':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=resolve(root,`.${path==='/'?'/index.html':path}`);
 if(!target.startsWith(root.endsWith(sep)?root:root+sep)||path.includes('/node_modules/')){res.writeHead(403);res.end();return;}
 if(!(await stat(target)).isFile())throw new Error('Not a file');
 res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(target));
 }catch{res.writeHead(404);res.end('Asset not found');}}).listen(3004,'127.0.0.1',()=>console.log('Aiko Asset Studio: http://127.0.0.1:3004/'));
