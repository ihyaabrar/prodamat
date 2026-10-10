import * as THREE from 'three';
import { createAiko } from './aiko-model.mjs';

// Reusable transparent viewer: no global listeners survive dispose().
export function mountAiko(container, { pose='Wave', animate=false, fallback='../svg/static/aiko-wave.svg', onError=()=>{}, onComplete=()=>{} }={}) {
 let renderer;
 try {renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});}
 catch(error){const image=document.createElement('img');image.src=fallback;image.alt='Aiko melambai';image.style.cssText='width:100%;height:100%;object-fit:contain';container.replaceChildren(image);onError(error);return {available:false,dispose(){image.remove();}};}
 renderer.setClearAlpha(0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Aiko, robot pendamping belajar dalam 3D');renderer.domElement.style.cssText='display:block;width:100%;height:100%';container.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#ffffff','#a8c6dd',2.4));
 const key=new THREE.DirectionalLight('#ffffff',3.5);key.position.set(-3,6,5);scene.add(key);
 const fill=new THREE.DirectionalLight('#c4e0ef',1.2);fill.position.set(4,3,-2);scene.add(fill);
 const {root,clips}=createAiko();scene.add(root);root.rotation.y=-.12;
 const camera=new THREE.OrthographicCamera(-2.1,2.1,4,-.3,.1,30);camera.position.set(0,2.4,8);camera.lookAt(0,1.8,0);
 const mixer=new THREE.AnimationMixer(root);const timer=new THREE.Timer();timer.connect(document);const media=matchMedia('(prefers-reduced-motion: reduce)');
 let current, running=animate,visible=true,disposed=false,activePose=pose;
 function render(){if(!disposed)renderer.render(scene,camera);}
 function frame(timestamp){timer.update(timestamp);const dt=Math.min(timer.getDelta(),.05);if(current&&running&&!media.matches)mixer.update(dt);render();}
 function schedule(){renderer.setAnimationLoop(running&&visible&&!document.hidden&&!media.matches?frame:null);timer.reset();render();}
 function setPose(name,play=running){
  const clip=clips.find(c=>c.name===name);if(!clip)throw new Error(`Unknown Aiko pose: ${name}`);
  mixer.stopAllAction();activePose=name;current=mixer.clipAction(clip);current.reset().setLoop(THREE.LoopOnce,1);current.clampWhenFinished=true;current.play();running=play;
  // The static fallback is a representative pose rather than a frozen neutral frame.
  mixer.update(play&&!media.matches?0:clip.duration*.25);schedule();
 }
 function pause(){running=false;schedule();}
 function play(){setPose(activePose,true);}
 const finished=()=>{running=false;schedule();onComplete();};mixer.addEventListener('finished',finished);
 const resize=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();const aspect=Math.max(width,1)/Math.max(height,1);const halfH=2.08;camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();renderer.setSize(Math.max(1,width),Math.max(1,height),false);render();});resize.observe(container);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});observer.observe(container);
 const visibility=()=>schedule();document.addEventListener('visibilitychange',visibility);
 const reduced=()=>{setPose(activePose,running);};media.addEventListener('change',reduced);
 setPose(pose,animate);
 return {available:true,renderer,scene,camera,root,setPose,play,pause,render,get pose(){return activePose;},get reducedMotion(){return media.matches;},get playing(){return running&&!media.matches;},
  dispose(){if(disposed)return;disposed=true;renderer.setAnimationLoop(null);timer.dispose();resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',reduced);mixer.removeEventListener('finished',finished);mixer.stopAllAction();mixer.uncacheRoot(root);const geometries=new Set(),materials=new Set();root.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)materials.add(n.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
 };
}
