import { mountAiko } from './three/mount-aiko.mjs';
const manifest=await fetch('manifest.json').then(r=>{if(!r.ok)throw new Error('Manifest unavailable');return r.json();});
const grid=document.querySelector('#pose-grid');
const washes=['','', 'sun','','sun','green'];
for(const [i,pose] of manifest.robot.entries()){
 const card=document.createElement('article');card.className='pose-card';
 card.innerHTML=`<div class="pose-stage ${washes[i]}"><span>0${i+1}</span><img src="${pose.static}" data-motion="${pose.animated}" alt="Aiko — ${pose.label}" width="400" height="420"></div><div class="pose-copy"><h3>${pose.label}</h3><p>${pose.use}.</p><div class="asset-links"><a href="${pose.static}" download>SVG diam</a><a href="${pose.animated}" download>SVG gerak</a><a href="${pose.png}" download>PNG</a></div></div>`;grid.append(card);
}
for(const icon of manifest.icons){const card=document.createElement('article');card.className='icon-item';card.innerHTML=`<img src="${icon.svg}" alt="" width="76" height="76"><div><h3>${icon.label}</h3><a href="${icon.svg}" download>SVG</a><a href="png/512/${icon.id}.png" download>PNG</a></div>`;document.querySelector('#icon-grid').append(card);}
const replay=document.querySelector('#replay');const reduced=matchMedia('(prefers-reduced-motion: reduce)');
replay.addEventListener('click',()=>{for(const image of grid.querySelectorAll('img'))image.src=`${reduced.matches?manifest.robot.find(p=>p.animated===image.dataset.motion).static:image.dataset.motion}?replay=${Date.now()}`;replay.textContent=reduced.matches?'Gerakan dikurangi oleh perangkat':'Putar ulang 6 animasi';});
const status=document.querySelector('#model-status');let model;
try{
 model=mountAiko(document.querySelector('#model'),{fallback:'svg/static/aiko-wave.svg',onError:()=>{status.textContent='Mode gambar: WebGL 2 tidak tersedia pada perangkat ini.';},onComplete:()=>{play.textContent='Putar ulang';status.textContent='Gerakan selesai. Bisa diputar ulang.';}});
 if(model.available)status.textContent='Model 3D siap · Gerakan diputar saat kamu klik';
}catch(error){status.textContent='Mode gambar aktif. Model GLB tetap bisa diunduh.';console.error(error);}
const select=document.querySelector('#model-pose'),play=document.querySelector('#play');
if(!model?.available){select.disabled=true;play.disabled=true;document.querySelector('#rotate').disabled=true;}
else{
 select.addEventListener('change',()=>{model.setPose(select.value,false);play.textContent='Putar gerakan';status.textContent=`Pose: ${select.selectedOptions[0].textContent} · Diam`;});
 play.addEventListener('click',()=>{if(model.playing){model.pause();play.textContent='Putar ulang';status.textContent='Gerakan dijeda.';}else{model.play();play.textContent=model.reducedMotion?'Putar ulang':'Jeda gerakan';status.textContent=model.reducedMotion?'Gerakan dikurangi oleh perangkat; pose tetap diam.':'Memutar sekali, lalu berhenti.';}});
 let turned=false;document.querySelector('#rotate').addEventListener('click',event=>{turned=!turned;model.root.rotation.y=turned?.8:-.12;model.render();event.currentTarget.textContent=turned?'Kembali ke depan':'Lihat dari samping';});
 addEventListener('pagehide',()=>model.dispose(),{once:true});
}
document.querySelector('#background').addEventListener('click',event=>{const on=document.querySelector('#model').classList.toggle('checker');event.currentTarget.textContent=on?'Latar krem':'Latar kotak';});
