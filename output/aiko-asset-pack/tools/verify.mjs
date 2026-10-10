import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import validator from 'gltf-validator';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const base=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
let svgCount=0,pngCount=0;
for(const p of manifest.robot){
 for(const file of [p.static,p.animated]){const svg=await readFile(new URL(file,base),'utf8');assert(svg.startsWith('<svg'));assert(svg.includes('<title'));assert(!/https?:|<script|<image/.test(svg.replace('http://www.w3.org/2000/svg','')));if(file===p.animated){assert(svg.includes('prefers-reduced-motion'));assert(!svg.includes('infinite'));}svgCount++;}
 for(const size of [512,1024]){const file=new URL(`png/${size}/aiko-${p.id}.png`,base),metadata=await sharp(await readFile(file)).metadata();assert.equal(metadata.width,size);assert(metadata.hasAlpha);const{data,info}=await sharp(await readFile(file)).raw().toBuffer({resolveWithObject:true});assert.equal(data[3],0);assert(data.some((value,i)=>i%info.channels===3&&value===255));pngCount++;}
}
for(const icon of manifest.icons){assert((await readFile(new URL(icon.svg,base),'utf8')).includes('<svg'));const meta=await sharp(await readFile(new URL(`png/512/${icon.id}.png`,base))).metadata();assert(meta.hasAlpha);svgCount++;pngCount++;}
const bytes=await readFile(new URL('three/aiko.glb',base));assert.equal(bytes.readUInt32LE(0),0x46546c67);
const jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
assert.deepEqual(gltf.animations.map(a=>a.name),manifest.model.clips);assert(gltf.meshes.length>25);assert(!gltf.images);assert(gltf.animations.every(a=>a.channels.length>0));
const report=await validator.validateBytes(new Uint8Array(bytes),{uri:'aiko.glb',maxIssues:100});
await writeFile(new URL('validation.json',base),JSON.stringify(report,null,2));assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues.messages));
for(const file of ['vendor/three/build/three.module.js','vendor/three/build/three.core.js','vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js','vendor/fonts/nunito-900.woff2'])assert((await readFile(new URL(file,base))).byteLength>0);
const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const mixer=new THREE.AnimationMixer(loaded.scene);let ended=0;mixer.addEventListener('finished',()=>ended++);
for(const c of loaded.animations){mixer.stopAllAction();const action=mixer.clipAction(c).reset().setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();mixer.update(.25);
 if(c.name==='Read'){assert(loaded.scene.getObjectByName('Book').scale.x>.99);assert(loaded.scene.getObjectByName('ArmRight').scale.x<.01);}else assert(loaded.scene.getObjectByName('Book').scale.x<.01);
 const target=loaded.scene.getObjectByName(c.name==='Idle'||c.name==='Celebrate'?'Rig':c.name==='Wave'?'ArmRight':'Head');
 const before=[...target.position.toArray(),...target.quaternion.toArray()];mixer.update(.37);const after=[...target.position.toArray(),...target.quaternion.toArray()];assert(before.some((v,i)=>Math.abs(v-after[i])>1e-5),`No motion in ${c.name}`);
 mixer.update(c.duration+1);assert(action.paused,`${c.name} did not stop`);
}assert.equal(ended,6);
console.log(JSON.stringify({svg:svgCount,png:pngCount,glbBytes:bytes.length,meshes:gltf.meshes.length,animationClips:gltf.animations.length,finiteAnimationsTested:ended,validatorErrors:report.issues.numErrors,validatorWarnings:report.issues.numWarnings},null,2));
