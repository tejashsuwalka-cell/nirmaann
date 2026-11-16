import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Door, FurnitureItem, Layout, WindowItem } from "./layout-types";
import { FURNITURE_SIZE, OFFSET_X, OFFSET_Z, nearestWall } from "./geometry";

export type MaterialPreset = "oak" | "concrete" | "glass";
export const MATERIAL_PRESETS: Record<MaterialPreset, { label: string; color: string; metalness: number; roughness: number; transmission: number; ior?: number }> = {
  oak: { label: "Minimal White (Oak)", color: "#ffffff", metalness: 0.05, roughness: 0.4, transmission: 0 },
  concrete: { label: "Polished Concrete", color: "#e2e8f0", metalness: 0.1, roughness: 0.6, transmission: 0 },
  glass: { label: "Architectural Glass", color: "#93c5fd", metalness: 0.1, roughness: 0.1, transmission: 0.85, ior: 1.5 },
};

const WALL_H = 56;
const DOOR_H = 44;
const SILL_H = 18;
const WIN_TOP = 44;
const PX = 0.05; // 20px = 1m

const std = (color: string, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function cyl(rt: number, rb: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function wallMaterial(p: MaterialPreset) {
  const c = MATERIAL_PRESETS[p];
  return new THREE.MeshPhysicalMaterial({
    color: c.color, metalness: c.metalness, roughness: c.roughness,
    transmission: c.transmission, ior: c.ior ?? 1.5, thickness: 4,
    transparent: c.transmission > 0, opacity: c.transmission > 0 ? 0.92 : 1,
  });
}

function buildSofa() {
  const g = new THREE.Group();
  const { w, d } = FURNITURE_SIZE.sofa;
  const fabric = std("#4f5b93", 0.9), cushion = std("#6370ad", 0.95), leg = std("#3f2a1d", 0.5);
  g.add(box(w, 4, d, fabric, 0, 4, 0));
  for (const [x, z] of [[-w / 2 + 2, -d / 2 + 2], [w / 2 - 2, -d / 2 + 2], [-w / 2 + 2, d / 2 - 2], [w / 2 - 2, d / 2 - 2]]) g.add(cyl(0.8, 0.6, 2, leg, x, 1, z));
  const cw = (w - 8) / 3;
  for (let i = 0; i < 3; i++) g.add(box(cw - 0.6, 3, d - 5, cushion, -w / 2 + 4 + cw / 2 + i * cw, 7.5, 2.2));
  g.add(box(w, 9, 4, fabric, 0, 10.5, -d / 2 + 2));
  g.add(box(4, 7, d, fabric, -w / 2 + 2, 8.5, 0));
  g.add(box(4, 7, d, fabric, w / 2 - 2, 8.5, 0));
  return g;
}
function buildBed() {
  const g = new THREE.Group();
  const { w, d } = FURNITURE_SIZE.bed;
  const wood = std("#a0714a", 0.55), mattress = std("#f8fafc", 0.9), duvet = std("#64748b", 0.95), pillow = std("#ffffff", 1);
  g.add(box(w, 4, d, wood, 0, 3, 0));
  g.add(box(w, 14, 2, wood, 0, 8, -d / 2 + 1));
  g.add(box(w - 2, 4, d - 4, mattress, 0, 7, 1));
  g.add(box(w - 1.6, 1.4, d * 0.58, duvet, 0, 9.6, d * 0.2));
  g.add(box(w - 1.6, 1.8, 3, duvet, 0, 9.8, d * 0.2 - d * 0.29));
  g.add(box(w / 2 - 4, 2.4, 6, pillow, -w / 4, 10.2, -d / 2 + 7));
  g.add(box(w / 2 - 4, 2.4, 6, pillow, w / 4, 10.2, -d / 2 + 7));
  return g;
}
function buildPlant() {
  const g = new THREE.Group();
  const pot = std("#c2410c", 0.8), soil = std("#3f2a1d", 1), leaf = std("#15803d", 0.7), leaf2 = std("#22a35a", 0.7);
  g.add(cyl(5, 3.6, 9, pot, 0, 4.5, 0));
  g.add(cyl(4.6, 4.6, 0.4, soil, 0, 9, 0));
  const blobs: [number, number, number, number][] = [[0, 15, 0, 4.5], [-2.8, 13, 1.5, 3.2], [2.6, 13.5, -1.2, 3.4], [1, 18.5, 1, 3], [-1.5, 17, -1.8, 2.8]];
  blobs.forEach(([x, y, z, r], i) => {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? leaf2 : leaf);
    s.position.set(x, y, z);
    s.castShadow = true;
    g.add(s);
  });
  g.add(cyl(0.4, 0.5, 6, soil, 0, 11.5, 0, 6));
  return g;
}
function buildTv() {
  const g = new THREE.Group();
  const { w, d } = FURNITURE_SIZE.tv_unit;
  const cab = std("#5b3a24", 0.5), black = std("#111827", 0.3, 0.4);
  g.add(box(w, 8, d, cab, 0, 4, 0));
  g.add(box(w - 2, 0.3, d - 2, std("#7c5233", 0.5), 0, 8.2, 0));
  g.add(box(2, 4, 2, black, 0, 10, -1));
  const sw = w * 0.9, sh = sw * 0.5;
  g.add(box(sw, sh, 1, black, 0, 12 + sh / 2, -1));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw - 1.2, sh - 1.2), new THREE.MeshStandardMaterial({ color: "#0b1530", emissive: "#1e3a8a", emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.2 }));
  screen.position.set(0, 12 + sh / 2, -0.45);
  g.add(screen);
  return g;
}
const FURN_BUILDERS = { sofa: buildSofa, bed: buildBed, plant: buildPlant, tv_unit: buildTv };

function buildDoor(door: Door, T: number) {
  const g = new THREE.Group();
  const w = door.width;
  const trim = std("#f1f5f9", 0.4), oak = std("#b07a45", 0.45), inset = std("#94603a", 0.5);
  const steel = new THREE.MeshStandardMaterial({ color: "#d1d5db", metalness: 1, roughness: 0.25 });
  g.add(box(2, DOOR_H + 2, T + 2, trim, -w / 2 - 1, (DOOR_H + 2) / 2, 0));
  g.add(box(2, DOOR_H + 2, T + 2, trim, w / 2 + 1, (DOOR_H + 2) / 2, 0));
  g.add(box(w + 4, 2, T + 2, trim, 0, DOOR_H + 1, 0));
  g.add(box(w - 0.6, DOOR_H - 0.4, 2, oak, 0, DOOR_H / 2, 0));
  g.add(box(w * 0.7, 15, 2.6, inset, 0, 12, 0));
  g.add(box(w * 0.7, 15, 2.6, inset, 0, 31, 0));
  for (const s of [1, -1]) {
    const lever = cyl(0.4, 0.4, 5, steel, w / 2 - 6, 22, s * 2.2, 10);
    lever.rotation.z = Math.PI / 2;
    g.add(lever);
    g.add(cyl(1, 1, 0.6, steel, w / 2 - 4, 22, s * 1.4, 12).rotateX(Math.PI / 2));
  }
  return g;
}
function buildWindow(win: WindowItem, T: number) {
  const g = new THREE.Group();
  const w = win.width, h = WIN_TOP - SILL_H;
  const stone = std("#d6d3d1", 0.85), frame = std("#1f2937", 0.4, 0.3);
  const glass = new THREE.MeshPhysicalMaterial({ color: "#dbeafe", transmission: 0.85, ior: 1.5, roughness: 0.05, metalness: 0, thickness: 1, transparent: true, opacity: 0.5 });
  g.add(box(w + 6, 2, T + 6, stone, 0, SILL_H - 1, 0));
  g.add(box(w, 1.6, T, frame, 0, WIN_TOP - 0.8, 0));
  g.add(box(w, 1.2, T, frame, 0, SILL_H + 0.6, 0));
  g.add(box(1.6, h, T, frame, -w / 2 + 0.8, SILL_H + h / 2, 0));
  g.add(box(1.6, h, T, frame, w / 2 - 0.8, SILL_H + h / 2, 0));
  const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 3, h - 2.6, 0.6), glass);
  pane.position.set(0, SILL_H + h / 2, 0);
  g.add(pane);
  g.add(box(0.8, h - 2, 1.2, frame, 0, SILL_H + h / 2, 0));
  g.add(box(w - 2, 0.8, 1.2, frame, 0, SILL_H + h / 2, 0));
  return g;
}

let floorTex: THREE.CanvasTexture | null = null;
function floorTexture() {
  if (floorTex) return floorTex;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d")!;
  const tones = ["#e7d3b5", "#e0c9a6", "#ead9bf", "#dcc39d", "#e4cfae"];
  for (let r = 0; r < 8; r++) {
    let off = (r % 2) * 120;
    for (let i = -1; i < 4; i++) {
      x.fillStyle = tones[(r * 3 + i + 5) % tones.length]!;
      x.fillRect(off + i * 200, r * 64, 198, 62);
      x.fillStyle = "rgba(120,80,40,0.06)";
      for (let k = 0; k < 6; k++) x.fillRect(off + i * 200, r * 64 + 6 + k * 9, 198, 1);
    }
    off = 0;
  }
  floorTex = new THREE.CanvasTexture(c);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.colorSpace = THREE.SRGBColorSpace;
  return floorTex;
}

export function buildLayoutGroup(layout: Layout, preset: MaterialPreset) {
  const root = new THREE.Group();
  root.scale.setScalar(PX);
  const wallMat = wallMaterial(preset);

  // Bounds for floor
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const extend = (x: number, y: number) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  layout.walls.forEach((w) => { extend(w.x1, w.y1); extend(w.x2, w.y2); });
  layout.furniture.forEach((f) => extend(f.x, f.y));
  if (!isFinite(minX)) { minX = 260; maxX = 460; minY = 160; maxY = 360; }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX + 20, maxY - minY + 20), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.55 }));
  floorTexture().repeat.set((maxX - minX + 20) / 160, (maxY - minY + 20) / 160);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((minX + maxX) / 2 - OFFSET_X, 0.1, (minY + maxY) / 2 - OFFSET_Z);
  floor.receiveShadow = true;
  root.add(floor);

  // Openings per wall
  type Op = { along: number; hw: number; kind: "door" | "window" };
  const ops = new Map<string, Op[]>();
  const place = (item: Door | WindowItem, kind: "door" | "window") => {
    const s = nearestWall(item.x, item.y, layout.walls, item.wallId);
    const T = s?.wall.thickness ?? 14;
    const grp = kind === "door" ? buildDoor(item as Door, T) : buildWindow(item as WindowItem, T);
    if (s && s.dist < 40) {
      grp.position.set(s.projX - OFFSET_X, 0, s.projY - OFFSET_Z);
      grp.rotation.y = -s.angle;
      const list = ops.get(s.wall.id) ?? [];
      list.push({ along: s.along, hw: item.width / 2 + (kind === "door" ? 2 : 0), kind });
      ops.set(s.wall.id, list);
    } else {
      grp.position.set(item.x - OFFSET_X, 0, item.y - OFFSET_Z);
    }
    root.add(grp);
  };
  layout.doors.forEach((d) => place(d, "door"));
  layout.windows.forEach((w) => place(w, "window"));

  for (const w of layout.walls) {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const ux = dx / len, uy = dy / len, angle = Math.atan2(dy, dx), T = w.thickness;
    const seg = (s0: number, s1: number, y0: number, y1: number, extra = 0) => {
      if (s1 - s0 < 0.5 || y1 - y0 < 0.5) return;
      const mid = (s0 + s1) / 2;
      const m = box(s1 - s0 + extra, y1 - y0, T, wallMat, w.x1 + ux * mid - OFFSET_X, (y0 + y1) / 2, w.y1 + uy * mid - OFFSET_Z);
      m.rotation.y = -angle;
      root.add(m);
    };
    const list = (ops.get(w.id) ?? []).sort((a, b) => a.along - b.along);
    let cur = 0;
    for (const o of list) {
      const a = Math.max(cur, o.along - o.hw), b = Math.min(len, o.along + o.hw);
      if (b <= a) continue;
      seg(cur, a, 0, WALL_H, cur === 0 ? T : 0);
      if (o.kind === "door") seg(a, b, DOOR_H + 2, WALL_H);
      else { seg(a, b, 0, SILL_H - 2); seg(a, b, WIN_TOP, WALL_H); }
      cur = b;
    }
    seg(cur, len, 0, WALL_H, cur === 0 ? T : 0);
  }

  for (const f of layout.furniture) {
    const g = FURN_BUILDERS[f.type]();
    g.position.set(f.x - OFFSET_X, 0, f.y - OFFSET_Z);
    g.rotation.y = -(f.rotation * Math.PI) / 180;
    g.scale.setScalar(f.scale);
    root.add(g);
  }
  return { root, center: new THREE.Vector3(((minX + maxX) / 2 - OFFSET_X) * PX, 0, ((minY + maxY) / 2 - OFFSET_Z) * PX), radius: (Math.hypot(maxX - minX, maxY - minY) / 2) * PX };
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat && (mat as THREE.MeshStandardMaterial).map !== floorTex) mat.dispose();
  });
}

export interface Viewer {
  setLayout: (layout: Layout, preset: MaterialPreset, refit?: boolean) => void;
  setAutoRotate: (on: boolean) => void;
  setParallax: (x: number, y: number) => void;
  dispose: () => void;
}

export function createViewer(container: HTMLElement, opts: { autoRotate?: boolean | undefined; enableZoom?: boolean | undefined; onReady?: (() => void) | undefined } = {}): Viewer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(10, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -14;
  sun.shadow.camera.right = sun.shadow.camera.top = 14;
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc7d2fe, 0.6);
  fill.position.set(-10, 8, -6);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.ShadowMaterial({ opacity: 0.12 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
  camera.position.set(14, 12, 14);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !!opts.autoRotate;
  controls.autoRotateSpeed = 1.1;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.enableZoom = opts.enableZoom ?? true;
  controls.minDistance = 4;
  controls.maxDistance = 60;

  const pivot = new THREE.Group();
  scene.add(pivot);
  let content: THREE.Group | null = null;
  const parallax = { x: 0, y: 0 };

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let raf = 0, ready = false;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    pivot.rotation.y += (parallax.x * 0.25 - pivot.rotation.y) * 0.05;
    pivot.rotation.x += (parallax.y * 0.08 - pivot.rotation.x) * 0.05;
    controls.update();
    renderer.render(scene, camera);
    if (!ready && content) { ready = true; opts.onReady?.(); }
  };
  loop();

  return {
    setLayout(layout, preset, refit = false) {
      if (content) { pivot.remove(content); disposeTree(content); }
      const { root, center, radius } = buildLayoutGroup(layout, preset);
      content = root;
      pivot.add(root);
      if (refit) {
        controls.target.copy(center);
        const d = Math.max(radius, 4) * 2.4;
        camera.position.set(center.x + d * 0.75, d * 0.7, center.z + d * 0.85);
        sun.target.position.copy(center);
        sun.target.updateMatrixWorld();
      }
    },
    setAutoRotate(on) { controls.autoRotate = on; },
    setParallax(x, y) { parallax.x = x; parallax.y = y; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      if (content) disposeTree(content);
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
