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

// Invisible walls around the playable area.
export function bounds(minX, maxX, minZ, maxZ) {
  const t = 1;
  colliders.push({ minX: minX - t, maxX: maxX + t, minZ: minZ - t, maxZ: minZ });
  colliders.push({ minX: minX - t, maxX: maxX + t, minZ: maxZ, maxZ: maxZ + t });
  colliders.push({ minX: minX - t, maxX: minX, minZ, maxZ });
  colliders.push({ minX: maxX, maxX: maxX + t, minZ, maxZ });
}

export function removeCollider(mesh) {
  const i = colliders.findIndex((c) => c.mesh === mesh);
  if (i >= 0) colliders.splice(i, 1);
}

// `y` lifts overlapping floors (lobby on top of a car park) so they do not z-fight.
export function floor(x, z, w, d, color, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
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

// Original face artwork, shared by NPCs rather than allocating a texture per person.
let faceMaterial;
function cartoonFace() {
  if (faceMaterial) return faceMaterial;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const c = canvas.getContext("2d");
  c.fillStyle = "#29232a";
  for (const x of [78, 178]) {
    c.beginPath(); c.ellipse(x, 108, 12, 17, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff5e6";
    c.beginPath(); c.arc(x - 3, 103, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#29232a";
  }
  c.strokeStyle = "#734c3c"; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(126, 133); c.lineTo(122, 145); c.lineTo(133, 145); c.stroke();
  c.strokeStyle = "#513534"; c.lineWidth = 7;
  c.beginPath(); c.moveTo(96, 175); c.quadraticCurveTo(128, 194, 160, 172); c.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  faceMaterial = new THREE.MeshLambertMaterial({ map: texture, transparent: true, depthWrite: false, flatShading: true });
  return faceMaterial;
}

// Six-part block rig. All accessories follow the head; limbs pivot at hips/shoulders.
export function person({ shirt = 0x3366aa, pants = 0x333344, skin = 0xd9a77c, hair = 0x1a1a1a, hairStyle = "short", hat = null, glasses = false, mustache = false, scar = false, height = 1, name = "" } = {}) {
  const g = new THREE.Group();
  const block = (parent, w, h, d, color, x, y, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const limb = (w, h, d, color, x, y) => {
    const mesh = block(g, w, h, d, color, x, y);
    mesh.geometry.translate(0, -h / 2, 0);
    return mesh;
  };
  const legL = limb(0.35, 0.61, 0.38, pants, -0.185, 0.61);
  const legR = limb(0.35, 0.61, 0.38, pants, 0.185, 0.61);
  block(g, 0.72, 0.60, 0.38, shirt, 0, 0.93);
  const armL = limb(0.34, 0.60, 0.38, shirt, -0.55, 1.23);
  const armR = limb(0.34, 0.60, 0.38, shirt, 0.55, 1.23);
  for (const arm of [armL, armR]) {
    // A skin-coloured end cap reads as a hand without introducing another joint.
    block(arm, 0.342, 0.164, 0.382, skin, 0, -0.52);
  }
  const head = block(g, 0.50, 0.48, 0.48, skin, 0, 1.49);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.46), cartoonFace());
  face.position.z = 0.242;
  head.add(face);
  if (hairStyle !== "bald") {
    block(head, 0.54, 0.08, 0.52, hair, 0, 0.25, -0.01);
    block(head, 0.54, 0.10, 0.10, hair, 0, 0.17, -0.23);
    if (hairStyle === "long") {
      block(head, 0.54, 0.45, 0.12, hair, 0, -0.015, -0.25);
      for (const x of [-0.255, 0.255]) block(head, 0.07, 0.35, 0.34, hair, x, -0.015, -0.06);
    }
  }
  if (hat) {
    block(head, 0.57, 0.13, 0.55, hat, 0, 0.275);
    block(head, 0.60, 0.04, 0.25, hat, 0, 0.20, 0.245);
  }
  if (glasses) {
    for (const x of [-0.095, 0.095]) {
      for (const y of [0.005, 0.10]) block(head, 0.16, 0.018, 0.025, 0x252733, x, y, 0.262);
      for (const edge of [-0.071, 0.071]) block(head, 0.018, 0.095, 0.025, 0x252733, x + edge, 0.0525, 0.262);
    }
    block(head, 0.04, 0.018, 0.025, 0x252733, 0, 0.06, 0.262);
    for (const x of [-0.245, 0.245]) block(head, 0.018, 0.018, 0.25, 0x252733, x, 0.07, 0.13);
  }
  if (mustache) {
    for (const x of [-0.046, 0.046]) {
      const half = block(head, 0.10, 0.035, 0.035, hair, x, -0.065, 0.265);
      half.rotation.z = Math.sign(x) * -0.16;
    }
  }
  if (scar) {
    const mark = block(head, 0.014, 0.11, 0.008, 0x995b50, 0.17, -0.035, 0.246);
    mark.rotation.z = -0.35;
    for (const y of [-0.025, 0, 0.025]) block(mark, 0.04, 0.008, 0.009, 0x995b50, 0, y);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // Transparent face artwork must not cast a square shadow over the skin.
  face.castShadow = false;
  g.scale.setScalar(height);
  g.userData = { parts: { legL, legR, armL, armR }, walk: 0, name };
  add(g);
  return g;
}

export function animateWalk(p, speed, dt) {
  const u = p.userData;
  const moving = Math.abs(speed) > 0.05;
  u.walk = moving ? u.walk + speed * dt * 4 : 0;
  const s = moving ? Math.sin(u.walk) * 0.8 : 0;
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
