// Game runtime: frame loop, shift sequencing, and the `ctx` API that shift scripts await on.
import * as THREE from "three";
import { renderer, scene, camera, clearLevel, add, person, animateWalk, mat, colliders, collide } from "./engine.js";
import { input, requestLock } from "./input.js";
import { player, placePlayer, updatePlayer, distTo, angleTo } from "./player.js";
import * as ui from "./ui.js";
import { audio } from "./audio.js";
import { loadSave, writeSave, clearSave, freshFlags } from "./save.js";
import { SHIFTS } from "./shifts/index.js";
import { ENDINGS } from "./endings.js";

const state = {
  mode: "title", // title | play | paused
  flags: freshFlags(),
  shift: 0,
  target: null, // compass target {x, z}
  waiters: [], // per-frame predicates: { test(dt) -> bool, resolve }
  updaters: [], // per-level animation callbacks
  npcs: [], // { mesh, path, speed, resolve }
  interactables: [], // { x, z, r, label, resolve }
  chase: null,
  flashlight: null,
  stun: 0,
  orbit: 0,
};
window.__game = { state, player, colliders };

/* ---------- ctx: the API shift scripts use ---------- */
export const ctx = {
  get flags() { return state.flags; },
  THREE, add, mat,
  talk: ui.talk, say: ui.say, choose: ui.choose, toast: ui.toast, flash: ui.flash, audio,
  async idCheck(doc) {
    window.__lastDoc = doc; // read by the automated playtest
    releaseLock();
    audio.paper();
    const allowed = await ui.idCheck(doc);
    const correct = allowed === !doc.invalid;
    if (allowed) audio.stamp(); else audio.deny();
    if (!correct && !doc.moral) state.flags.mistakes++;
    return { allowed, correct };
  },
  objective(text, x = null, z = null) {
    ui.setObjective(text);
    state.target = x === null ? null : { x, z };
    if (text) audio.blip(660);
  },
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); },
  until(test) { return new Promise((resolve) => state.waiters.push({ test, resolve })); },
  reach(x, z, r = 1.6) { return ctx.until(() => distTo(x, z) < r); },
  interact(x, z, label, r = 2.2) {
    return new Promise((resolve) => state.interactables.push({ x, z, r, label, resolve }));
  },
  npc(opts, x, z, yaw = 0) {
    const p = person(opts);
    p.position.set(x, 0, z);
    p.rotation.y = yaw;
    return p;
  },
  walkTo(mesh, x, z, speed = 1.6) {
    return new Promise((resolve) => state.npcs.push({ mesh, path: [[x, z]], speed, resolve }));
  },
  faceBoth(mesh) {
    const mx = mesh.position.x, mz = mesh.position.z;
    let dx = player.x - mx, dz = player.z - mz;
    let dist = Math.hypot(dx, dz);
    // Chunky R6 heads fill the view if you stand inside them; step back to talk.
    const stand = 2.45 * (mesh.scale.y || 1);
    let nx, nz;
    if (dist > 0.08) { nx = dx / dist; nz = dz / dist; }
    else { nx = Math.sin(player.yaw); nz = Math.cos(player.yaw); }
    if (dist < stand) {
      [player.x, player.z] = collide(mx + nx * stand, mz + nz * stand, player.radius);
    }
    mesh.rotation.y = Math.atan2(player.x - mx, player.z - mz);
    player.yaw = Math.atan2(-(mx - player.x), -(mz - player.z));
    player.pitch = 0;
    camera.position.set(player.x, 1.62, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.yaw;
    camera.rotation.x = 0;
  },
  onUpdate(fn) { state.updaters.push(fn); },
  /* Chase: the runner follows `path`, then loops from index `loopFrom`. Catch them within `time` seconds.
     Resolves true when caught. */
  chase({ npc, path, loopFrom = 0, speed = 4.4, time = 60, name = "Kẻ gian", headStart = 1.2, stunText = "Hắn xô bác loạng choạng!" }) {
    audio.whistle();
    state.stun = headStart;
    ui.toast(headStart > 0 ? `${stunText} Đuổi theo! Giữ Shift để chạy.` : "Đuổi theo! Giữ Shift để chạy.");
    return new Promise((resolve) => {
      state.chase = { npc, path, loopFrom, i: 0, speed, t: time, stumble: 4 + Math.random() * 2, down: 0, name, resolve };
      state.target = { x: npc.position.x, z: npc.position.z, follow: npc };
    });
  },
  flashlight(on) {
    if (on && !state.flashlight) {
      const l = new THREE.SpotLight(0xfff2cc, 40, 22, 0.5, 0.45, 1.2);
      l.position.set(0.2, -0.2, 0);
      l.target.position.set(0, -0.3, -3);
      camera.add(l, l.target);
      state.flashlight = l;
    } else if (!on && state.flashlight) {
      camera.remove(state.flashlight, state.flashlight.target);
      state.flashlight = null;
    }
  },
  // Glowing post used for patrol checkpoints and objectives.
  marker(x, z, color = 0x58d0ff) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), mat(0x333333));
    post.position.y = 0.6;
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color }));
    lamp.position.y = 1.45;
    const light = new THREE.PointLight(color, 3, 4, 2);
    light.position.y = 1.45;
    g.add(post, lamp, light);
    g.position.set(x, 0, z);
    add(g);
    state.updaters.push((dt, t) => { lamp.rotation.y += dt * 2; lamp.position.y = 1.45 + Math.sin(t * 3) * 0.06; });
    return g;
  },
  remove(obj) { obj.parent?.remove(obj); },
  place(x, z, yaw) { placePlayer(x, z, yaw); },
  get player() { return player; },
};

let releasing = false;
function releaseLock() { if (document.pointerLockElement) { releasing = true; document.exitPointerLock(); } }

/* ---------- input routing ---------- */
input.onAction = () => {
  audio.unlock();
  if (ui.modalKey("action")) return;
  if (state.mode !== "play") return;
  const it = nearestInteractable();
  if (it) {
    state.interactables.splice(state.interactables.indexOf(it), 1);
    ui.setPrompt("");
    audio.blip(520);
    it.resolve();
  }
};
input.onChoice = (n) => ui.modalKey("choice", n);
input.onPause = () => { if (state.mode === "play" && !ui.modalActive()) pause(); };
ui.pauseButton.addEventListener("click", () => input.onPause());
document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement && !releasing && state.mode === "play" && !ui.modalActive()) pause();
  releasing = false;
});
renderer.domElement.addEventListener("click", () => { audio.unlock(); if (state.mode === "play" && !ui.modalActive()) requestLock(); });

function nearestInteractable() {
  let best = null, bd = Infinity;
  for (const it of state.interactables) {
    const d = distTo(it.x, it.z);
    if (d < it.r && d < bd) { bd = d; best = it; }
  }
  return best;
}

async function pause() {
  state.mode = "paused";
  input.keys.clear();
  releaseLock();
  for (;;) {
    const i = await ui.card({
      kicker: "Tạm dừng", title: "Nghỉ tay chút",
      body: `<p>Ca ${state.shift + 1}/5. Tiến độ đã lưu từ đầu ca.</p>`,
      buttons: ["Tiếp tục", audio.muted ? "Bật âm thanh" : "Tắt âm thanh", "Về màn hình chính"],
    });
    if (i === 1) { audio.setMuted(!audio.muted); continue; }
    if (i === 2) { location.href = location.pathname + (location.search.includes("touch") ? "?touch" : ""); return; }
    break;
  }
  state.mode = "play";
}

/* ---------- frame loop ---------- */
const timer = new THREE.Timer();
let elapsed = 0;
renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const dt = Math.min(timer.getDelta(), 0.05);
  elapsed += dt;
  const playing = state.mode === "play" && !ui.modalActive();
  if (state.stun > 0 && playing) state.stun -= dt;
  player.frozen = !playing || state.stun > 0;
  if (state.mode === "title") {
    state.orbit += dt * 0.08;
    camera.position.set(Math.sin(state.orbit) * 18, 7, Math.cos(state.orbit) * 18 + 4);
    camera.lookAt(0, 1.5, 0);
  } else if (state.mode !== "paused") {
    updatePlayer(dt);
  }
  if (state.mode !== "paused") {
    for (const f of state.updaters) f(dt, elapsed);
    if (playing) tick(dt);
  }
  renderer.render(scene, camera);
});

function tick(dt) {
  for (let i = state.waiters.length - 1; i >= 0; i--) {
    const w = state.waiters[i];
    if (w.test(dt)) { state.waiters.splice(i, 1); w.resolve(); }
  }
  for (let i = state.npcs.length - 1; i >= 0; i--) {
    const n = state.npcs[i];
    if (moveAlong(n.mesh, n.path[0], n.speed, dt)) { animateWalk(n.mesh, 0, dt); state.npcs.splice(i, 1); n.resolve(); }
  }
  if (state.chase) tickChase(dt);
  const it = nearestInteractable();
  ui.setPrompt(it ? `[E] ${it.label}` : "");
  if (state.target) {
    if (state.target.follow) { state.target.x = state.target.follow.position.x; state.target.z = state.target.follow.position.z; }
    ui.setCompass(angleTo(state.target.x, state.target.z), distTo(state.target.x, state.target.z));
  } else ui.setCompass(null);
  document.querySelector("#stamina div").style.width = player.stamina * 100 + "%";
  document.getElementById("stamina").classList.toggle("tired", player.tired);
}

function moveAlong(mesh, [tx, tz], speed, dt) {
  const dx = tx - mesh.position.x, dz = tz - mesh.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.15) return true;
  const s = Math.min(d, speed * dt);
  mesh.position.x += (dx / d) * s;
  mesh.position.z += (dz / d) * s;
  mesh.rotation.y = Math.atan2(dx, dz);
  animateWalk(mesh, speed, dt);
  return false;
}

function tickChase(dt) {
  const c = state.chase;
  c.t -= dt;
  ui.setTimer(`${c.name} · ${Math.max(0, Math.ceil(c.t))} giây`);
  const d = distTo(c.npc.position.x, c.npc.position.z);
  if (d < 1.4) return endChase(true);
  if (c.t <= 0) return endChase(false);
  c.stumble -= dt;
  if (c.stumble <= 0) { c.down = 0.9; c.stumble = 5 + Math.random() * 2.5; if (d < 12) ui.toast(`${c.name} vấp ngã!`, 1200); }
  let speed = c.speed * (d > 14 ? 0.6 : d < 3.5 ? 1.06 : 1);
  if (c.down > 0) { c.down -= dt; speed *= 0.15; }
  if (moveAlong(c.npc, c.path[c.i], speed, dt)) c.i = c.i + 1 >= c.path.length ? c.loopFrom : c.i + 1;
}

function endChase(caught) {
  const c = state.chase;
  state.chase = null;
  state.target = null;
  ui.setTimer("");
  input.keys.clear();
  animateWalk(c.npc, 0, 0);
  if (caught) { audio.catchHit(); ui.flash("#fff"); ctx.faceBoth(c.npc); }
  c.resolve(caught);
}

/* ---------- shift sequencing ---------- */
function resetLevel() {
  ctx.flashlight(false);
  player.drainMul = 1;
  state.waiters = []; state.updaters = []; state.npcs = []; state.interactables = []; state.chase = null; state.target = null;
  ui.setTimer(""); ui.setPrompt(""); ui.setObjective("");
  clearLevel();
}

async function playShift(i) {
  const S = SHIFTS[i];
  state.shift = i;
  writeSave(i, state.flags);
  resetLevel();
  S.build(ctx);
  audio.ambience(S.ambience);
  ui.setShiftName(`Ca ${i + 1}/5 · ${S.place} · ${S.time}`);
  ui.setRetire(i === 4 ? "Ca cuối cùng" : `Còn ${5 - i} ca nữa về hưu`);
  state.mode = "intro";
  ui.showHud(false);
  await ui.card({ kicker: `Ca ${i + 1} / 5 · ${S.time}`, title: S.title, body: S.intro, buttons: ["Bắt đầu ca trực"], cls: "intro" });
  state.mode = "play";
  ui.showHud(true);
  requestLock();
  const result = await S.run(ctx);
  ui.showHud(false);
  state.mode = "intro";
  releaseLock();
  input.keys.clear();
  return result;
}

async function campaign(from) {
  for (let i = from; i < SHIFTS.length; i++) {
    const result = await playShift(i);
    if (i < SHIFTS.length - 1) {
      audio.good();
      await ui.card({ kicker: `Hết ca ${i + 1}`, title: SHIFTS[i].doneTitle, body: summary(), buttons: ["Ca tiếp theo"], cls: "summary" });
    } else {
      await showEnding(result);
    }
  }
}

function summary() {
  const f = state.flags;
  const names = { minh: "bé Minh", hang: "chị Hằng", thao: "cô Thảo", tuan: "cậu Tuấn" };
  const ev = { soTruc: "Sổ trực đêm 2006", saoKe: "Sao kê chuyển tiền", loiKhai: "Lời kể của ông Sáu", hopDong: "Hợp đồng ký khống" };
  const helped = Object.entries(f.helped).filter(([, v]) => v).map(([k]) => names[k]);
  const evid = Object.entries(f.evidence).filter(([, v]) => v).map(([k]) => ev[k]);
  return `<p><b>Người bác đã giúp:</b> ${helped.length ? helped.join(", ") : "chưa ai"}</p>
    <p><b>Manh mối vụ án 2006:</b> ${evid.length ? evid.join(", ") : "chưa có"}</p>
    <p><b>Sai sót khi kiểm tra giấy tờ:</b> ${f.mistakes}</p>
    <p class="muted">Đã tự lưu. Có thể tắt máy, lần sau bấm “Chơi tiếp”.</p>`;
}

async function showEnding(id) {
  const E = ENDINGS[id] || ENDINGS.quiet;
  clearSave();
  localStorage.setItem("bac-bao-ve-endings", JSON.stringify([...new Set([...seenEndings(), id])]));
  audio.ending(id);
  await ui.card({ kicker: `Kết thúc ${E.n}/3`, title: E.title, body: E.body + summary().replace(/<p class="muted">.*<\/p>/, ""), buttons: ["Về màn hình chính"], cls: "ending ending-" + id });
  location.href = location.pathname + (location.search.includes("touch") ? "?touch" : "");
}

function seenEndings() {
  try { return JSON.parse(localStorage.getItem("bac-bao-ve-endings")) || []; } catch { return []; }
}

export async function titleScreen() {
  // ?ca=N jumps straight to shift N with fresh flags (for testing a single shift).
  const jump = +new URLSearchParams(location.search).get("ca");
  if (jump >= 1 && jump <= SHIFTS.length) { state.flags = freshFlags(); return campaign(jump - 1); }
  resetLevel();
  SHIFTS[0].build(ctx);
  state.mode = "title";
  ui.showHud(false);
  const save = loadSave();
  const seen = seenEndings();
  const buttons = ["Chơi mới"];
  if (save) buttons.push(`Chơi tiếp (ca ${save.shift + 1})`);
  buttons.push("Hướng dẫn");
  for (;;) {
    const i = await ui.card({
      kicker: "Một trò chơi về năm ca trực cuối cùng",
      title: "Bác Bảo Vệ",
      body: `<p class="sub">Bác Năm, 59 tuổi. Còn 5 ca nữa là về hưu.<br>Và một vụ án cũ chưa bao giờ khép lại.</p>
        ${seen.length ? `<p class="muted">Kết thúc đã mở: ${seen.length}/3</p>` : ""}`,
      buttons, cls: "title",
    });
    audio.unlock();
    const label = buttons[i];
    if (label === "Hướng dẫn") {
      await ui.card({ kicker: "Hướng dẫn", title: "Cách trực ca", buttons: ["Đã hiểu"], body: `
        <ul class="help">
          <li><b>W A S D</b> đi lại · <b>chuột</b> hoặc <b>← →</b> nhìn quanh (bấm vào màn hình để khóa chuột)</li>
          <li><b>Shift</b> chạy, nhưng bác có tuổi rồi: hết thanh sức là phải đi chậm lại</li>
          <li><b>E</b> nói chuyện, kiểm tra, chấm công · <b>1 2 3</b> chọn lời thoại</li>
          <li><b>Esc / P</b> tạm dừng</li>
          <li>Điện thoại: cần gạt trái để đi, vuốt bên phải để nhìn, nút <b>E</b> và <b>Chạy</b></li>
          <li>Mũi tên trên cùng chỉ hướng việc cần làm</li>
        </ul>` });
      continue;
    }
    if (label === "Chơi mới") { state.flags = freshFlags(); return campaign(0); }
    state.flags = save.flags;
    return campaign(save.shift);
  }
}
