import { writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createAiko } from '../three/aiko-model.mjs';
globalThis.FileReader=class {
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
 readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
};
const {root,clips}=createAiko();
const data=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips,trs:true,onlyVisible:false});
await writeFile(new URL('../three/aiko.glb',import.meta.url),Buffer.from(data));
console.log(`Exported aiko.glb: ${(data.byteLength/1024).toFixed(0)} KB, ${clips.length} animation clips.`);
