// Renderer, scene, camera, colliders and low-poly builders shared by every shift.
import * as THREE from "three";

export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById("app").appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);
scene.add(camera);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Axis-aligned boxes on the XZ plane that the player and NPCs cannot walk through.
export const colliders = [];
let level = new THREE.Group();
scene.add(level);

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts }));
  return matCache.get(key);
}

export function clearLevel() {
  scene.remove(level);
  level.traverse((o) => o.geometry && o.geometry.dispose());
  level = new THREE.Group();
  scene.add(level);
  colliders.length = 0;
  scene.fog = null;
  return level;
}

export function add(obj) {
  level.add(obj);
  return obj;
}

// A box centred at (x, z) resting on y. `solid` registers it as a collider.
export function box(x, y, z, w, h, d, color, { solid = true, parent = null, shadow = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === "object" ? color : mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  (parent || level).add(m);
  if (solid) colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, mesh: m });
  return m;
}

export function cyl(x, y, z, r, h, color, { solid = true, seg = 8, parent = null } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(color));
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  (parent || level).add(m);
  if (solid) colliders.push({ minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, mesh: m });
  return m;
}

export function removeCollider(mesh) {
  const i = colliders.findIndex((c) => c.mesh === mesh);
  if (i >= 0) colliders.splice(i, 1);
}

export function floor(x, z, w, d, color) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0, z);
  m.receiveShadow = true;
  level.add(m);
  return m;
}

// Room: four walls with optional door gaps. doors: { n|s|e|w: [offset, width] }.
export function room(cx, cz, w, d, h, wallColor, doors = {}, t = 0.3) {
  const wall = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 0.01) return;
    const horiz = Math.abs(z2 - z1) < 0.01;
    box((x1 + x2) / 2, 0, (z1 + z2) / 2, horiz ? len : t, h, horiz ? t : len, wallColor);
  };
  const side = (ax, az, bx, bz, door) => {
    if (!door) return wall(ax, az, bx, bz);
    const [off, dw] = door;
    const len = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    const a = len / 2 + off - dw / 2, b = len / 2 + off + dw / 2;
    wall(ax, az, ax + ux * a, az + uz * a);
    wall(ax + ux * b, az + uz * b, bx, bz);
    box(ax + ux * (len / 2 + off), h - 0.5, az + uz * (len / 2 + off), Math.abs(ux) * dw + Math.abs(uz) * t, 0.5,
      Math.abs(uz) * dw + Math.abs(ux) * t, wallColor, { solid: false });
  };
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  side(x0, z0, x1, z0, doors.n);
  side(x0, z1, x1, z1, doors.s);
  side(x0, z0, x0, z1, doors.w);
  side(x1, z0, x1, z1, doors.e);
}

export function lights({ sky = 0x8fb4d8, ground = 0x554433, hemi = 0.9, sun = 1.2, sunColor = 0xfff1d6, fog = null, bg = 0x8fb4d8 } = {}) {
  scene.background = new THREE.Color(bg);
  add(new THREE.HemisphereLight(sky, ground, hemi));
  const s = new THREE.DirectionalLight(sunColor, sun);
  s.position.set(15, 25, 10);
  s.castShadow = true;
  s.shadow.mapSize.set(1024, 1024);
  Object.assign(s.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  add(s);
  if (fog) scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]);
  return s;
}

export function pointLight(x, y, z, color = 0xffe0a0, intensity = 8, dist = 10) {
  const l = new THREE.PointLight(color, intensity, dist, 1.5);
  l.position.set(x, y, z);
  add(l);
  return l;
}

// Text sign rendered to a canvas texture (all signage is generated, no image assets).
export function sign(text, x, y, z, rotY = 0, { w = 2.4, h = 0.6, bg = "#1d3b6a", fg = "#fff" } = {}) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = Math.round(512 * h / w);
  const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = fg; g.font = `bold ${Math.round(c.height * 0.5)}px system-ui, "Noto Sans", sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  add(m);
  return m;
}

// Low-poly person. Returns a group with .parts for simple walk animation.
export function person({ shirt = 0x3366aa, pants = 0x333344, skin = 0xd9a77c, hair = 0x1a1a1a, hat = null, glasses = false, height = 1, name = "" } = {}) {
  const g = new THREE.Group();
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.2), mat(pants));
  const legR = legL.clone();
  legL.position.set(-0.11, 0.4, 0); legR.position.set(0.11, 0.4, 0);
  legL.geometry.translate(0, -0.4, 0); legL.position.y = 0.8; legR.position.y = 0.8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.28), mat(shirt));
  body.position.y = 1.12;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.16), mat(shirt));
  armL.geometry.translate(0, -0.3, 0);
  const armR = armL.clone();
  armL.position.set(-0.33, 1.42, 0); armR.position.set(0.33, 1.42, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.3), mat(skin));
  head.position.y = 1.62;
  const hairM = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.32), mat(hair));
  hairM.position.y = 1.82;
  g.add(legL, legR, body, armL, armR, head, hairM);
  if (hat) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 8), mat(hat));
    h.position.y = 1.9; g.add(h);
  }
  if (glasses) {
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.02), mat(0x111111));
    gl.position.set(0, 1.66, 0.16); g.add(gl);
  }
  const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.02), mat(0x111111));
  eyes.position.set(0, 1.64, 0.155); g.add(eyes);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(height);
  g.userData = { parts: { legL, legR, armL, armR }, walk: 0, name };
  add(g);
  return g;
}

export function animateWalk(p, speed, dt) {
  const u = p.userData;
  u.walk += speed * dt * 3;
  const s = speed > 0.05 ? Math.sin(u.walk) * 0.6 : 0;
  u.parts.legL.rotation.x = s; u.parts.legR.rotation.x = -s;
  u.parts.armL.rotation.x = -s; u.parts.armR.rotation.x = s;
}

// Push a circle at (x, z) out of all colliders. Returns corrected [x, z].
export function collide(x, z, r) {
  for (const c of colliders) {
    const nx = Math.max(c.minX, Math.min(x, c.maxX));
    const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - nx, dz = z - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x = nx + (dx / d) * r; z = nz + (dz / d) * r;
      } else {
        // centre inside box: push out along the shallowest axis
        const pen = [x - c.minX + r, c.maxX - x + r, z - c.minZ + r, c.maxZ - z + r];
        const i = pen.indexOf(Math.min(...pen));
        if (i === 0) x = c.minX - r; else if (i === 1) x = c.maxX + r; else if (i === 2) z = c.minZ - r; else z = c.maxZ + r;
      }
    }
  }
  return [x, z];
}
