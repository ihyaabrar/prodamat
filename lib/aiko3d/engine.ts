// Aiko 3D untuk aplikasi siswa. Dimuat dinamis (lihat components/aiko-3d.tsx) agar three.js tidak ikut bundel awal.
// Satu renderer dipakai bergantian: kanvasnya dipindah ke wadah yang sedang tampil, rendering berhenti saat tidak ada wadah.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { AikoPose } from "@/lib/aiko-art";

type Values = { lz: number; rz: number; lx: number; rx: number; wristR: number; headX: number; headY: number; headZ: number; hop: number; lean: number; book: number; squint: number; sparkle: number; brows: number };
const REST: Values = { lz: -0.22, rz: 0.22, lx: 0, rx: 0, wristR: 0, headX: 0, headY: 0, headZ: 0, hop: 0, lean: 0, book: 0, squint: 0, sparkle: 0, brows: 0 };
const DURATION: Record<AikoPose, number> = { idle: 2.4, wave: 2.6, thinking: 2.8, reading: 3.2, celebrate: 2.4, reassure: 2.4 };
const POSE: Record<AikoPose, (t: number) => Partial<Values>> = {
  idle: t => ({ headZ: Math.sin(t * Math.PI) * 0.06, lz: -0.32, rz: 0.32 }),
  wave: t => ({ rz: 2.5 + Math.sin(t * Math.PI * 2 * 1.35) * 0.32, wristR: Math.sin(t * Math.PI * 2 * 1.35 + 0.6) * 0.35, headZ: -0.1, headY: 0.12, lean: -0.04, sparkle: 0.4 }),
  thinking: t => ({ rx: -2.25, rz: -0.6, wristR: 0.7, headZ: 0.22 * Math.sin(Math.min(t, 2) * Math.PI), headX: -0.06, lz: -0.3, squint: 1 }),
  reading: t => ({ lx: -1.15, rx: -1.15, lz: 0.32, rz: -0.32, headX: 0.22 + Math.sin(t * Math.PI * 1.3) * 0.04, headY: Math.sin(t * Math.PI * 0.9) * 0.08, book: 1 }),
  celebrate: t => ({ lz: -2.7 - Math.sin(t * Math.PI * 4) * 0.12, rz: 2.7 + Math.sin(t * Math.PI * 4) * 0.12, hop: Math.max(0, Math.sin(Math.min(t / 1.6, 1) * Math.PI * 2)) * 0.45, headX: -0.1, sparkle: 1 }),
  reassure: t => ({ rx: -0.75, rz: 0.75, wristR: -0.3, headX: 0.16 * Math.max(0, Math.sin(Math.min(t / 1.6, 1) * Math.PI * 2)), headZ: 0.08, brows: 1 }),
};
const smooth = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const FRAME = 1 / 30;

export type AikoEngine = ReturnType<typeof createEngine>;
let shared: AikoEngine | null = null;
export function getEngine() { return shared ??= createEngine(); }

function createEngine() {
  const canvas = document.createElement("canvas");
  canvas.className = "aiko3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  // Dua bingkai: "full" untuk Aiko utuh, "bust" untuk kepala dan dada yang muncul dari tepi bawah kotak biru Beranda.
  const FRAMING = {
    full: { camera: [0, 0.05, 8.9], look: [0, -0.22, 0], turn: 0, tilt: 0, ground: true, rest: REST },
    // Tangan kiri sedikit terbuka; tangan kanan keluar melewati tepi kanan kotak, seperti menyapa dari balik layar.
    bust: { camera: [0.77, 0.3, 5.7], look: [0.77, -0.05, 0], turn: -0.3, tilt: -0.08, ground: false, rest: { ...REST, lz: -0.7, lx: -0.25, rz: 1.6, rx: -0.75, wristR: -0.5 } },
  } satisfies Record<string, { camera: [number, number, number]; look: [number, number, number]; turn: number; tilt: number; ground: boolean; rest: Values }>;
  type Framing = keyof typeof FRAMING;
  let rest: Values = REST;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c8e6, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-1.6, 8, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.radius = 5;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbcd2ff, 1.6);
  rim.position.set(4, 3, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff1dc, 0.6);
  fill.position.set(4, -1, 5);
  scene.add(fill);

  const plastic = (color: number, extra: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, ...extra });
  const M = {
    shell: plastic(0xf3f9fd), limb: plastic(0x97bed7), limbDark: plastic(0x7da9c9), leg: plastic(0xa8c6dd), ear: plastic(0x7aa7c6), neck: plastic(0x729dbb), panel: plastic(0xfafdff),
    visor: new THREE.MeshPhysicalMaterial({ color: 0x193951, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xc3f5ef, emissive: 0x9ff0e6, emissiveIntensity: 1.25, roughness: 0.4 }),
    cheek: new THREE.MeshStandardMaterial({ color: 0xffb9ad, emissive: 0xff9c8c, emissiveIntensity: 0.35, roughness: 0.6, transparent: true, opacity: 0.9 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffc94d, emissive: 0xffb420, emissiveIntensity: 0.55, roughness: 0.35 }),
    book: plastic(0x2244bd), paper: plastic(0xfff8e6, { clearcoat: 0 }),
  };
  const shadowed = <T extends THREE.Mesh>(mesh: T) => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
  const box = (w: number, h: number, d: number, r: number, mat: THREE.Material, seg = 6) => shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat));
  const capsule = (r: number, len: number, mat: THREE.Material) => shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 16), mat));
  const tube = (points: [number, number, number][], radius: number, mat: THREE.Material) =>
    new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(...points.map(p => new THREE.Vector3(...p)) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]), 20, radius, 8, false), mat);

  const aiko = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group();
  aiko.add(hips); hips.add(torso); scene.add(aiko);
  function setFraming(framing: Framing) {
    const f = FRAMING[framing];
    camera.position.set(...f.camera);
    camera.lookAt(...f.look);
    aiko.rotation.set(0, f.turn, f.tilt);
    ground.visible = f.ground;
    rest = f.rest;
  }
  for (const side of [-1, 1]) {
    const leg = capsule(0.17, 0.34, M.leg); leg.position.set(side * 0.33, -2.12, 0); hips.add(leg);
    const foot = box(0.46, 0.2, 0.62, 0.09, M.leg); foot.position.set(side * 0.35, -2.42, 0.08); hips.add(foot);
  }
  const body = box(1.46, 1.28, 1.06, 0.46, M.shell, 8); body.position.y = -1.32; torso.add(body);
  const belly = box(0.9, 0.66, 0.12, 0.2, M.panel); belly.position.set(0, -1.3, 0.5); torso.add(belly);
  // Tulisan oranye UAD; MeshBasicMaterial tanpa tone mapping agar warnanya tetap oranye resmi.
  const logo = new THREE.TextureLoader().load("/aiko3d/uad-orange.png");
  logo.colorSpace = THREE.SRGBColorSpace;
  logo.anisotropy = 4;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66 * 243 / 640), new THREE.MeshBasicMaterial({ map: logo, transparent: true, toneMapped: false }));
  badge.position.set(0, -1.3, 0.563); torso.add(badge);
  const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.1, 20), M.neck)); neck.position.y = -0.66; torso.add(neck);

  const makeArm = (side: number) => {
    const shoulder = new THREE.Group(); shoulder.position.set(side * 0.78, -0.95, 0);
    const upper = capsule(0.135, 0.52, M.limb); upper.position.y = -0.36; shoulder.add(upper);
    const wrist = new THREE.Group(); wrist.position.y = -0.78; shoulder.add(wrist);
    wrist.add(shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), M.limbDark)));
    for (const [x, z, tilt] of [[-0.09, 0.03, 0.35], [0, 0.05, 0], [0.09, 0.03, -0.35]]) {
      const finger = capsule(0.045, 0.12, M.limbDark); finger.position.set(x * side, -0.15, z); finger.rotation.z = tilt * side; wrist.add(finger);
    }
    torso.add(shoulder);
    return { shoulder, wrist };
  };
  const armL = makeArm(-1), armR = makeArm(1);

  const head = new THREE.Group(); head.position.y = -0.47; torso.add(head);
  const skull = box(2.06, 1.42, 1.34, 0.5, M.shell, 8); skull.position.y = 0.55; head.add(skull);
  const visor = box(1.64, 0.92, 0.22, 0.3, M.visor); visor.position.set(0, 0.52, 0.6); head.add(visor);
  const face = new THREE.Group(); face.position.set(0, 0.52, 0.73); head.add(face);
  const eyes = new THREE.Group(); face.add(eyes);
  const brows = new THREE.Group(); face.add(brows);
  for (const side of [-1, 1]) {
    const eye = tube([[-0.15, 0, 0], [0, 0.19, 0], [0.15, 0, 0]], 0.04, M.glow); eye.position.set(side * 0.42, 0.06, 0); eyes.add(eye);
    // Alis lembut untuk pose menenangkan; sepasang, miring ke dalam.
    const brow = tube([[-0.11, 0, 0], [0, 0.05, 0], [0.11, 0, 0]], 0.022, M.glow); brow.position.set(side * 0.42, 0.3, 0); brow.rotation.z = side * -0.18; brows.add(brow);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), M.cheek); cheek.scale.set(0.11, 0.06, 0.02); cheek.position.set(side * 0.6, -0.17, 0); face.add(cheek);
    const ear = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.14, 24), M.ear)); ear.rotation.z = Math.PI / 2; ear.position.set(side * 1.08, 0.5, 0); head.add(ear);
  }
  const mouth = tube([[-0.2, 0, 0], [0, -0.22, 0], [0.2, 0, 0]], 0.035, M.glow); mouth.position.y = -0.16; face.add(mouth);
  const antenna = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 10), M.neck)); antenna.position.y = 1.46; head.add(antenna);
  const lamp = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), M.lamp)); lamp.position.y = 1.74; head.add(lamp);

  const book = new THREE.Group();
  for (const side of [-1, 1]) {
    const cover = box(0.62, 0.8, 0.05, 0.03, M.book, 2); cover.position.x = side * 0.31; cover.rotation.y = -side * 0.18; book.add(cover);
    const page = box(0.56, 0.74, 0.06, 0.02, M.paper, 2); page.position.set(side * 0.29, 0, 0.04); page.rotation.y = -side * 0.18; book.add(page);
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.025, 0.01), new THREE.MeshStandardMaterial({ color: 0xd99a14 }));
      line.position.set(side * 0.29, 0.18 - i * 0.14, 0.08); line.rotation.y = -side * 0.18; book.add(line);
    }
  }
  book.position.set(0, -1.05, 0.95); book.rotation.x = -0.35; book.visible = false; torso.add(book);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -2.52; ground.receiveShadow = true; scene.add(ground);

  // Konfeti sekali jalan saat merayakan
  const confetti: THREE.Mesh[] = [];
  const confettiGeometry = new THREE.PlaneGeometry(0.09, 0.15);
  const confettiColors = [0x3158df, 0xffc94d, 0x237a4e, 0xffffff];
  function burst() {
    for (let i = 0; i < 30; i++) {
      const piece = new THREE.Mesh(confettiGeometry, new THREE.MeshBasicMaterial({ color: confettiColors[i % 4], side: THREE.DoubleSide, transparent: true }));
      piece.position.set(0, 1, 0.3);
      const angle = Math.random() * Math.PI * 2, speed = 2.2 + Math.random() * 2;
      piece.userData = { v: new THREE.Vector3(Math.cos(angle) * speed * 0.7, 3.2 + Math.random() * 2.4, Math.sin(angle) * speed * 0.4), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), life: 0 };
      scene.add(piece); confetti.push(piece);
    }
  }
  function updateConfetti(dt: number) {
    for (let i = confetti.length - 1; i >= 0; i--) {
      const piece = confetti[i], data = piece.userData as { v: THREE.Vector3; spin: THREE.Vector3; life: number };
      data.life += dt; data.v.y -= 7.5 * dt; data.v.multiplyScalar(0.985);
      piece.position.addScaledVector(data.v, dt);
      piece.rotation.x += data.spin.x * dt; piece.rotation.y += data.spin.y * dt; piece.rotation.z += data.spin.z * dt;
      (piece.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - Math.max(0, data.life - 1.2) / 0.6);
      if (data.life > 1.8) { scene.remove(piece); (piece.material as THREE.Material).dispose(); confetti.splice(i, 1); }
    }
  }

  // ---------- Status ----------
  let host: HTMLElement | null = null;
  let active: { pose: AikoPose; start: number } | null = null;
  let clock = 0, carry = 0, last = 0, blinkAt = 2;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  let frames = 0, measureFrom = 0, onSlow: (() => void) | null = null, onMeasure: ((fps: number) => void) | null = null;

  function play(pose: AikoPose) {
    if (pose === "celebrate") burst();
    active = { pose, start: clock };
  }
  function target(): Values {
    const result = { ...rest };
    if (!active) return result;
    const local = clock - active.start, duration = DURATION[active.pose];
    if (local > duration) { active = null; return result; }
    const weight = smooth(local / 0.35) * smooth((duration - local) / 0.45);
    const values = POSE[active.pose](local);
    for (const key of Object.keys(values) as (keyof Values)[]) result[key] = rest[key] + (values[key]! - rest[key]) * weight;
    return result;
  }
  function apply(p: Values) {
    const breath = Math.sin(clock * 2.1);
    torso.scale.set(1 + breath * 0.006, 1 + breath * 0.012, 1);
    hips.position.y = p.hop;
    torso.rotation.z = p.lean;
    look.x += (look.tx - look.x) * 0.08; look.y += (look.ty - look.y) * 0.08;
    head.rotation.set(p.headX + breath * 0.012 - look.y * 0.18, p.headY + look.x * 0.42, p.headZ);
    armL.shoulder.rotation.set(p.lx, 0, p.lz - breath * 0.02);
    armR.shoulder.rotation.set(p.rx, 0, p.rz + breath * 0.02);
    armR.wrist.rotation.z = p.wristR;
    book.visible = p.book > 0.01; book.scale.setScalar(Math.max(0.001, p.book));
    if (clock > blinkAt + 0.14) blinkAt = clock + 2.6 + Math.random() * 2.4;
    const blinking = clock >= blinkAt && clock < blinkAt + 0.14;
    // Ekspresi: menyipit saat berpikir, membesar dan berbinar saat merayakan, alis lembut saat menenangkan.
    eyes.scale.set(1 + p.sparkle * 0.18, blinking ? 0.15 : (1 - p.squint * 0.45) * (1 + p.sparkle * 0.18), 1);
    mouth.scale.set(1 - p.squint * 0.35 + p.sparkle * 0.15, 1 - p.squint * 0.5 + p.sparkle * 0.2, 1);
    brows.visible = p.brows > 0.05; brows.scale.setScalar(Math.max(0.001, p.brows));
    M.glow.emissiveIntensity = 1.25 + p.sparkle * 0.6;
    lamp.material.emissiveIntensity = 0.55 + p.sparkle * 0.6 + Math.max(0, breath) * 0.1;
  }
  function resize() {
    if (!host) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);

  // Dibatasi 30 fps untuk menghemat baterai Chromebook; fps sesungguhnya diukur 2 detik pertama.
  function loop(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    carry += dt;
    if (carry < FRAME) return;
    const step = carry; carry = 0;
    clock += step;
    apply(target());
    updateConfetti(step);
    renderer.render(scene, camera);
    if (onSlow || onMeasure) {
      frames++;
      const elapsed = (now - measureFrom) / 1000;
      if (elapsed > 2) {
        const fps = frames / elapsed, slow = onSlow, report = onMeasure;
        onSlow = null; onMeasure = null;
        report?.(Math.round(fps));
        if (slow && fps < 22) slow();
      }
    }
  }

  return {
    mount(element: HTMLElement, options: { onSlow?: () => void; onMeasure?: (fps: number) => void; framing?: Framing } = {}) {
      setFraming(options.framing ?? "full");
      if (host) observer.unobserve(host);
      host = element;
      element.appendChild(canvas);
      observer.observe(element);
      resize();
      frames = 0; measureFrom = performance.now(); onSlow = options.onSlow ?? null; onMeasure = options.onMeasure ?? null;
      last = performance.now();
      renderer.setAnimationLoop(loop);
    },
    unmount(element: HTMLElement) {
      if (host !== element) return;
      observer.unobserve(element);
      if (canvas.parentElement === element) element.removeChild(canvas);
      host = null; onSlow = null;
      renderer.setAnimationLoop(null);
    },
    pause(paused: boolean) { renderer.setAnimationLoop(paused || !host ? null : loop); last = performance.now(); },
    play,
    lookAt(x: number, y: number) { look.tx = Math.max(-1, Math.min(1, x)); look.ty = Math.max(-1, Math.min(1, y)); },
  };
}

export function webglAvailable() {
  try { const canvas = document.createElement("canvas"); return !!(canvas.getContext("webgl2") || canvas.getContext("webgl")); }
  catch { return false; }
}
