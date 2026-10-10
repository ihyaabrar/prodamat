import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Aiko is rebuilt as real geometry. Metres: approximately 3.6 tall.
// Its silhouette and palette follow the existing application mascot.
export function createAiko() {
 const root = new THREE.Group(); root.name='Aiko';
 const mats={};
 for(const [name,color] of Object.entries({shell:'#f5fcff',ice:'#c4e0ef',rim:'#accddd',limb:'#97bed7',joint:'#729dbb',screen:'#193951',mint:'#c3f5ef',pink:'#ffb9ad',yellow:'#ffc94d',blue:'#3158df',page:'#fff4d6'})) {
  mats[name]=new THREE.MeshStandardMaterial({color,roughness:name==='screen'?.82:.58,metalness:.02});
 }
 const attach=(parent,geometry,mat,name,x=0,y=0,z=0)=>{
  geometry.deleteAttribute('uv');const mesh=new THREE.Mesh(geometry,mats[mat]);mesh.name=name;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 };
 const box=(parent,name,w,h,d,r,mat,x,y,z)=>attach(parent,new RoundedBoxGeometry(w,h,d,3,r),mat,name,x,y,z);
 const panel=(parent,name,w,h,d,r,mat,x,y,z)=>{
  const s=new THREE.Shape(),a=-w/2,b=-h/2;
  s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+h-r);s.quadraticCurveTo(a+w,b+h,a+w-r,b+h);s.lineTo(a+r,b+h);s.quadraticCurveTo(a,b+h,a,b+h-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  return attach(parent,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:3,curveSegments:12} ),mat,name,x,y,z);
 };
 const ball=(parent,name,r,mat,x,y,z)=>attach(parent,new THREE.SphereGeometry(r,20,12),mat,name,x,y,z);
 const tube=(parent,name,points,r,mat)=>attach(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,8,false),mat,name);
 const rig=new THREE.Group();rig.name='Rig';root.add(rig);
 box(rig,'Body rim',1.44,1.25,.69,.42,'rim',0,1.07,0);
 box(rig,'Body',1.39,1.20,.71,.4,'ice',0,1.09,.025);
 panel(rig,'Chest',.84,.57,.04,.20,'shell',0,1.07,.39);
 const star=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.085:.16;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();
 attach(rig,new THREE.ExtrudeGeometry(star,{depth:.025,bevelEnabled:false}),'blue','Chest star',0,1.07,.455);
 box(rig,'Neck',.42,.24,.35,.08,'joint',0,1.73,0);
 for(const [side,x,angle]of [['Left',-.32,-.08],['Right',.40,.13]]){
  const leg=new THREE.Group();leg.name=`Leg${side}`;leg.position.set(x,.46,0);leg.rotation.z=angle;rig.add(leg);
  box(leg,`Leg ${side}`, .32,.53,.37,.12,'limb',0,-.20,0);
  box(leg,`Foot ${side}`,.45,.20,.53,.09,'ice',side==='Left'?-.025:.035,-.41,.07);
 }
 const arm=(side,pivot,points,fingers)=>{
  const g=new THREE.Group();g.name=`Arm${side}`;g.position.fromArray(pivot);rig.add(g);
  ball(g,`${side} shoulder`,.145,'joint',0,0,0);
  tube(g,`${side} arm`,points,.123,'limb');
  const tip=points.at(-1);ball(g,`${side} palm`,.12,'limb',...tip);
  fingers.forEach((end,i)=>tube(g,`${side} finger ${i}`,[tip,end],.045,'joint'));
  return g;
 };
 const armLeft=arm('Left',[-.64,1.42,0],[[0,0,0],[-.3,-.1,.015],[-.58,-.31,.02]],[[-.81,-.26,.02],[-.76,-.44,.02],[-.57,-.60,.02]]);
 const armRight=arm('Right',[.64,1.42,0],[[0,0,0],[.29,.12,.015],[.55,.52,.02]],[[.50,.79,.02],[.69,.79,.02],[.86,.58,.02]]);
 const head=new THREE.Group();head.name='Head';head.position.set(0,1.76,0);rig.add(head);
 ball(head,'Ear left',.15,'joint',-1.08,.69,0);ball(head,'Ear right',.15,'joint',1.08,.69,0);
 box(head,'Head rim',2.07,1.43,.83,.49,'rim',0,.67,0);
 box(head,'Head shell',2.02,1.38,.86,.46,'shell',0,.69,.018);
 panel(head,'Face screen',1.63,.91,.06,.29,'screen',0,.70,.45);
 const eyes=new THREE.Group();eyes.name='Eyes';eyes.position.set(0,.8,.56);head.add(eyes);
 for(const x of [-.43,.43]) tube(eyes,`Eye ${x}`,[[x-.10,-.025,0],[x,-.025+.105,0],[x+.10,-.025,0]],.034,'mint');
 tube(head,'Smile',[[-.20,.56,.56],[0,.455,.56],[.20,.56,.56]],.03,'mint');
 for(const x of [-.62,.62]) { const cheek=ball(head,`Cheek ${x}`,.086,'pink',x,.55,.565);cheek.scale.set(1,.53,.18); }
 tube(head,'Antenna',[[0,1.36,0],[0,1.73,0]],.045,'joint');
 ball(head,'Lamp rim',.145,'shell',0,1.82,0);ball(head,'Lamp',.12,'yellow',0,1.82,.04);
 const book=new THREE.Group();book.name='Book';book.position.set(0,.99,.75);book.scale.setScalar(.001);rig.add(book);
 const leftPage=box(book,'Book left cover',.63,.62,.08,.045,'blue',-.32,0,0);leftPage.rotation.y=-.15;
 const rightPage=box(book,'Book right cover',.63,.62,.08,.045,'blue',.32,0,0);rightPage.rotation.y=.15;
 for(const x of [-.32,.32]){
  const page=box(book,`Page ${x}`,.56,.55,.035,.018,'page',x,.02,.06);page.rotation.y=x<0?-.15:.15;
  for(let i=0;i<3;i++)box(book,`Line ${x} ${i}`,.34,.018,.01,.005,'joint',x,.13-i*.105,.10);
  const hand=ball(book,`Book hand ${x}`,.115,'limb',x<0?-.66:.66,-.06,.045);hand.scale.set(.65,1.25,.7);
 }
 for(const side of [-1,1])tube(book,`Reading arm ${side}`,[[side*.64,.43,-.75],[side*.84,.18,-.36],[side*.66,-.06,.045]],.12,'limb');
 const quatTrack=(node,times,angles)=>new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`,times,angles.flatMap(a=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...a)).toArray()));
 const scaleBook=(times,on)=>new THREE.VectorKeyframeTrack('Book.scale',times,times.flatMap(()=>on?[1,1,1]:[.001,.001,.001]));
 const clip=(name,duration,tracks)=>new THREE.AnimationClip(name,duration,tracks);
 const clips=[
  clip('Idle',3,[new THREE.VectorKeyframeTrack('Rig.position',[0,1.5,3],[0,0,0,0,.025,0,0,0,0]),new THREE.VectorKeyframeTrack('Eyes.scale',[0,1.3,1.38,1.48,3],[1,1,1,1,1,1,1,.1,1,1,1,1,1,1,1]),quatTrack(armRight,[0,3],[[0,0,-.95],[0,0,-.95]]),scaleBook([0,3],false)]),
  clip('Wave',2.4,[quatTrack(armRight,[0,.4,.8,1.2,1.6,2,2.4],[[0,0,0],[0,0,.33],[0,0,0],[0,0,.33],[0,0,0],[0,0,.33],[0,0,0]]),scaleBook([0,2.4],false)]),
  clip('Think',3,[quatTrack(head,[0,1.3,2.2,3],[[0,0,-.1],[0,.06,-.16],[0,.06,-.16],[0,0,-.1]]),quatTrack(armRight,[0,3],[[0,-.12,.45],[0,-.12,.45]]),scaleBook([0,3],false)]),
  clip('Read',3,[quatTrack(head,[0,1.5,3],[[.13,0,0],[.18,0,0],[.13,0,0]]),scaleBook([0,3],true)]),
  clip('Celebrate',2.4,[quatTrack(armLeft,[0,.4,1.2,2.4],[[0,0,-1.5],[0,0,-1.65],[0,0,-1.5],[0,0,-1.5]]),quatTrack(armRight,[0,.4,1.2,2.4],[[0,0,.15],[0,0,.3],[0,0,.15],[0,0,.15]]),new THREE.VectorKeyframeTrack('Rig.position',[0,.3,.6,1.1,1.4,1.7,2.4],[0,0,0,0,.15,0,0,0,0,0,0,0,0,.15,0,0,0,0,0,0,0]),scaleBook([0,2.4],false)]),
  clip('Reassure',2.8,[quatTrack(head,[0,.7,1.4,2.1,2.8],[[0,0,0],[.06,0,.035],[0,0,0],[.06,0,.035],[0,0,0]]),quatTrack(armRight,[0,1.4,2.8],[[0,0,-.95],[0,0,-.85],[0,0,-.95]]),scaleBook([0,2.8],false)])
 ];
 for(const c of clips)for(const arm of [armLeft,armRight]){const s=c.name==='Read'?.001:1;c.tracks.push(new THREE.VectorKeyframeTrack(`${arm.name}.scale`,[0,c.duration],[s,s,s,s,s,s]));}
 root.userData={character:'Aiko',palette:'AI di Sekitar Kita',authoring:'Standalone asset; application code unchanged',units:'metres'};
 return {root,clips,parts:{rig,head,armLeft,armRight,book},materials:mats};
}
