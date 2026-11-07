// Isolated headless WebGL test, not the user's desktop/browser session.
// bun tools/check-characters.mjs [screenshot directory]
import { chromium } from "playwright-core";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const output = resolve(process.argv[2] || "/workspace/bac-bar-free-screenshots/roblox-chars");
const temp = await mkdtemp(join(tmpdir(), "block-characters-"));
await mkdir(output, { recursive: true });
const root = resolve(import.meta.dir, "..");
const entry = join(temp, "fixture.js");
await writeFile(entry, `
import * as THREE from ${JSON.stringify(join(root, "node_modules/three/build/three.module.js"))};
import { person, animateWalk, renderer, scene, camera, colliders } from ${JSON.stringify(join(root, "src/engine.js"))};
import { buildSchool } from ${JSON.stringify(join(root, "src/shifts/school.js"))};
buildSchool();
const colliderCount = colliders.length;
const looks = [
  { name: "Hoa · long hair", shirt: "#f4f0e8", pants: "#2b3a6b", hair: "#222", hairStyle: "long" },
  { name: "Minh · 72% height", shirt: "#ffffff", pants: "#1f3c88", hair: "#111", height: 0.72 },
  { name: "Khải · glasses / mustache", shirt: "#1b2440", pants: "#1b2440", hair: "#888", glasses: true, mustache: true },
  { name: "Hùng · cap / scar", shirt: "#222", pants: "#222", hair: "#111", scar: true, hat: "#222" },
  { name: "Bald variant", shirt: "#b65c45", hairStyle: "bald" },
];
const actors = looks.map((look, i) => {
  const actor = person(look);
  actor.position.set((i - 2) * 1.8, 0.012, 5);
  return actor;
});
const check = (condition, message) => { if (!condition) throw new Error(message); };
const size = actor => new THREE.Box3().setFromObject(actor).getSize(new THREE.Vector3());
check(colliders.length === colliderCount, "NPC builder changed gameplay colliders");
check(size(actors[0]).y > 1.7 && size(actors[0]).y < 1.83, "Adult height outside first-person scale");
check(Math.abs(size(actors[1]).y / 0.72 - size(actors[2]).y) < 0.001, "Child scaling is not uniform");
for (const actor of actors) {
  check(actor.children.length === 6, "Rig must have exactly six root parts");
  check(Object.keys(actor.userData.parts).sort().join() === "armL,armR,legL,legR", "Walk API changed");
  for (const part of Object.values(actor.userData.parts)) {
    part.geometry.computeBoundingBox();
    check(Math.abs(part.geometry.boundingBox.max.y) < 1e-6, "Limb pivot must be at top");
    check(part.castShadow, "Limb shadow missing");
  }
  const { legL, legR, armL, armR } = actor.userData.parts;
  const left = new THREE.Box3().setFromObject(legL), right = new THREE.Box3().setFromObject(legR);
  check(left.max.x < right.min.x, "Leg seam missing");
  animateWalk(actor, 1.8, 0.15);
  check(Math.abs(legL.rotation.x) > 0.65, "Walk swing too small");
  check(legL.rotation.x === -legR.rotation.x && legL.rotation.x === -armL.rotation.x && armL.rotation.x === -armR.rotation.x, "Arms and legs must oppose");
  animateWalk(actor, 0, 0);
  check(Object.values(actor.userData.parts).every(part => part.rotation.x === 0) && actor.userData.walk === 0, "Idle failed to reset pose");
}
const heads = actors.map(actor => actor.children[5]);
check(heads.every(head => head.children[0].material === heads[0].children[0].material), "Face texture should be shared");
check(heads[4].children.length === 1, "Bald variant must have no hair");
check(heads[3].children.length > heads[1].children.length, "Cap/scar missing");
window.characterTest = { actors, report: { checks: "PASS: scale, six-part rig, hip/shoulder pivots, seams, shadows, opposite walk, idle reset, shared face, bald/cap/scar, colliders unchanged", heights: actors.map(actor => +size(actor).y.toFixed(4)), colliderCount }, draw(mode) {
  actors.forEach(actor => { actor.rotation.y = mode === "back" ? Math.PI * 0.85 : -0.12; animateWalk(actor, mode === "walk" ? 1.8 : 0, 0.15); });
  const close = mode === "adult-child" || mode === "accessories";
  const x = mode === "adult-child" ? -2.7 : 0.9;
  camera.fov = close ? 50 : 42; camera.updateProjectionMatrix();
  camera.position.set(close ? x : 0, close ? 1.62 : 2.6, close ? 8.5 : 16);
  camera.lookAt(close ? x : 0, 0.9, 5);
  renderer.render(scene, camera);
} };
window.characterTest.draw("front");
`);
let server, browser;
try {
  const built = await Bun.build({ entrypoints: [entry], outdir: temp, target: "browser", naming: "bundle.js" });
  if (!built.success) throw new Error(built.logs.join("\n"));
  server = Bun.serve({ port: 0, fetch(request) {
    if (new URL(request.url).pathname === "/bundle.js") return new Response(Bun.file(join(temp, "bundle.js")));
    return new Response('<!doctype html><meta charset="utf-8"><style>body{margin:0}#caption{position:absolute;top:16px;left:16px;color:#fff;background:#243141dc;padding:12px;font:16px sans-serif}</style><div id="app"></div><div id="caption">Block rig · Hoa / Minh (0.72) / Khải / Hùng / bald variant<br>Staged character review in the real school map</div><script type="module" src="/bundle.js"></script>', { headers: { "Content-Type": "text/html" } });
  } });
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(server.url.href);
  await page.waitForFunction(() => window.characterTest, null, { timeout: 30000 });
  for (const mode of ["front", "walk", "back", "adult-child", "accessories"]) {
    await page.evaluate(mode => window.characterTest.draw(mode), mode);
    await page.screenshot({ path: join(output, `school-${mode}.png`) });
  }
  if (errors.length) throw new Error(errors.join("\n"));
  const report = await page.evaluate(() => window.characterTest.report);
  await writeFile(join(output, "verification.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, screenshots: output }, null, 2));
} finally {
  await browser?.close();
  server?.stop(true);
  await rm(temp, { recursive: true, force: true });
}
