// Tự chơi thử: điều khiển game thật chỉ bằng bàn phím (W, mũi tên, Shift, E, phím số) trong Chrome headless.
// Cách dùng: bun run dev, rồi `node tools/choi-thu.mjs good|cold|bribe [thư mục ảnh] [url] [phút tối đa]`.
// good -> kết thúc 1, cold -> kết thúc 2, bribe -> kết thúc 3. Đặt CHROME_PATH nếu Chrome nằm chỗ khác.
// Bot đọc window.__lastDoc.invalid để biết giấy tờ hợp lệ hay không (nó không tự soi ảnh).
import { chromium } from "playwright-core";
import fs from "fs";

const policyName = process.argv[2] || "good";
const outDir = process.argv[3] || "anh-chup/run-" + policyName;
const startUrl = process.argv[4] || "http://localhost:5173/";
const maxMinutes = +(process.argv[5] || 25);
fs.mkdirSync(outDir, { recursive: true });

// choice policies: ordered list of substrings to prefer; idRefuse: names to refuse
const POLICIES = {
  // policies are extended below
  good: { prefer: ["Vô chòi", "Cất sổ", "Cô Hằng phát hiện", "tra giúp", "Ngồi xuống", "Biên bản", "Từ chối phong bì", "Giao hết"], idAllow: ["Nguyễn Đức Tuấn"], },
  cold: { prefer: ["Trường đóng cửa", "Để lại", "chỉ là bảo vệ", "Ông ngủ", "không thấy rõ", "Nhận phong bì", "công an"], idAllow: [] },
  // giveup: stands still during chases (to check the "arsonist escapes" branch)
  giveup: { prefer: ["Giao hết", "công an"], idAllow: [], noChase: true },
  bribe: { prefer: ["Vô chòi", "Cất sổ", "Cô Hằng phát hiện", "tra giúp", "Ngồi xuống", "Biên bản", "Nhận phong bì", "Nhận tiền"], idAllow: ["Nguyễn Đức Tuấn"] },
};
const policy = POLICIES[policyName];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 1024, height: 576 } });
p.on("pageerror", (e) => log("PAGEERROR", e.message));
p.on("console", (m) => m.type() === "error" && log("console.error", m.text()));
await p.goto(startUrl);
await p.waitForTimeout(2000);

let shotN = 0;
const seen = new Set();
async function shot(label, once = true) {
  if (once && seen.has(label)) return;
  seen.add(label);
  const f = `${outDir}/${String(++shotN).padStart(3, "0")}-${label.replace(/[\/:,.!]/g, "")}.png`;
  await p.screenshot({ path: f });
  log("shot", f);
}

const held = new Set();
async function hold(keys) {
  for (const k of [...held]) if (!keys.includes(k)) { await p.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await p.keyboard.down(k); held.add(k); }
}

async function state() {
  return p.evaluate(() => {
    const g = window.__game, s = g.state, pl = g.player;
    const on = (id) => document.getElementById(id).classList.contains("on");
    return {
      mode: s.mode, x: pl.x, z: pl.z, yaw: pl.yaw, chase: !!s.chase,
      target: s.target ? { x: s.target.x, z: s.target.z } : null,
      prompt: document.getElementById("prompt").textContent,
      objective: document.getElementById("objective").textContent,
      shiftName: document.getElementById("shiftName").textContent,
      card: on("card") ? { title: document.querySelector("#card h1")?.textContent, buttons: [...document.querySelectorAll("#card button")].map((b) => b.textContent), kicker: document.querySelector("#card .kicker")?.textContent || "" } : null,
      dialogue: on("dialogue") ? { name: document.getElementById("dlgName").textContent, text: document.getElementById("dlgText").textContent, choices: [...document.querySelectorAll("#dlgChoices .choice")].map((b) => b.textContent) } : null,
      idcheck: on("idcheck") ? { fields: [...document.querySelectorAll(".idcard td")].map((t) => t.textContent), title: document.querySelector(".idtitle").textContent } : null,
      flags: s.flags,
      shift: s.shift,
    };
  });
}

/* ---- A* on a 0.5 m grid built from the level colliders ---- */
let grid = null, gridKey = "";
async function buildGrid() {
  const cols = await p.evaluate(() => window.__game.colliders.map((c) => [c.minX, c.maxX, c.minZ, c.maxZ]));
  const key = cols.length + ":" + cols.slice(0, 5).join(",");
  if (key === gridKey) return;
  gridKey = key;
  const C = 0.5, R = 0.45;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [a, b2, c, d] of cols) { minX = Math.min(minX, a); maxX = Math.max(maxX, b2); minZ = Math.min(minZ, c); maxZ = Math.max(maxZ, d); }
  minX = Math.max(minX, -80); minZ = Math.max(minZ, -80); maxX = Math.min(maxX, 80); maxZ = Math.min(maxZ, 80);
  const W = Math.ceil((maxX - minX) / C), H = Math.ceil((maxZ - minZ) / C);
  const blocked = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = minX + (i + 0.5) * C, z = minZ + (j + 0.5) * C;
    for (const [a, b2, c, d] of cols) if (x > a - R && x < b2 + R && z > c - R && z < d + R) { blocked[j * W + i] = 1; break; }
  }
  grid = { C, minX, minZ, W, H, blocked };
  log("grid", W, H, cols.length);
}
function cell(x, z) { return [Math.floor((x - grid.minX) / grid.C), Math.floor((z - grid.minZ) / grid.C)]; }
function free(i, j) { return i >= 0 && j >= 0 && i < grid.W && j < grid.H && !grid.blocked[j * grid.W + i]; }
function nearestFree(i, j) {
  if (free(i, j)) return [i, j];
  for (let r = 1; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (free(i + di, j + dj)) return [i + di, j + dj];
  return [i, j];
}
function astar(sx, sz, tx, tz) {
  const [si, sj] = nearestFree(...cell(sx, sz)), [ti, tj] = nearestFree(...cell(tx, tz));
  const W = grid.W, start = sj * W + si, goal = tj * W + ti;
  const g = new Map([[start, 0]]), came = new Map(), open = [[0, start]];
  const h = (n) => Math.hypot((n % W) - ti, Math.floor(n / W) - tj);
  let it = 0;
  while (open.length && it++ < 40000) {
    open.sort((a, b2) => a[0] - b2[0]);
    const [, cur] = open.shift();
    if (cur === goal) break;
    const ci = cur % W, cj = Math.floor(cur / W);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = ci + di, nj = cj + dj;
      if (!free(ni, nj) || (di && dj && (!free(ci + di, cj) || !free(ci, cj + dj)))) continue;
      const n = nj * W + ni, ng = g.get(cur) + Math.hypot(di, dj);
      if (ng < (g.get(n) ?? Infinity)) { g.set(n, ng); came.set(n, cur); open.push([ng + h(n), n]); }
    }
  }
  const path = [];
  let n = goal;
  if (!came.has(goal) && goal !== start) return [[tx, tz]];
  while (n !== start) { path.unshift([grid.minX + ((n % W) + 0.5) * grid.C, grid.minZ + (Math.floor(n / W) + 0.5) * grid.C]); n = came.get(n); }
  path.push([tx, tz]);
  return path;
}

function angleTo(s, x, z) {
  const a = Math.atan2(-(x - s.x), -(z - s.z));
  let d = a - s.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pickChoice(choices) {
  for (const pref of policy.prefer) {
    const i = choices.findIndex((c) => c.includes(pref));
    if (i >= 0) return i;
  }
  return 0;
}

const startT = Date.now();
let path = null, pathT = 0, lastPos = null, stuckT = 0, lastProgress = Date.now(), unstick = 0;
let lastCardTitle = "";
for (;;) {
  if (Date.now() - startT > maxMinutes * 60000) { log("TIMEOUT"); await shot("timeout", false); break; }
  const s = await state();
  if (s.card) {
    await hold([]);
    const t = s.card.title;
    if (t !== lastCardTitle) {
      lastCardTitle = t;
      log("CARD", s.card.kicker, "|", t, s.card.buttons);
      await shot("card-" + t.replace(/\s+/g, "_").slice(0, 30), true);
    }
    if (/Kết thúc/.test(s.card.kicker)) { log("ENDING", t, JSON.stringify(s.flags)); break; }
    const btns = s.card.buttons;
    let i = btns.findIndex((x) => /Chơi mới|Bắt đầu|Ca tiếp|Tiếp tục|Chơi tiếp/.test(x));
    if (startUrl.includes("continue")) { const j = btns.findIndex((x) => /Chơi tiếp/.test(x)); if (j >= 0) i = j; }
    await p.keyboard.press(btns.length > 1 ? "Digit" + (Math.max(i, 0) + 1) : "KeyE");
    await p.waitForTimeout(500);
    continue;
  }
  if (s.idcheck) {
    await hold([]);
    const name = s.idcheck.fields[1];
    await shot("idcheck-ca" + (s.shift + 1));
    // Refuse when the card has a problem: decided by the field values + stamp; the bot cheats slightly by reading the game's doc.invalid
    const invalid = await p.evaluate(() => window.__lastDoc?.invalid);
    let allow = !invalid;
    if (policy.idAllow.includes(name)) allow = true;
    if (!policy.idAllow.includes(name) && name === "Nguyễn Đức Tuấn") allow = false;
    log("IDCHECK", s.idcheck.title, name, allow ? "ALLOW" : "REFUSE");
    await p.keyboard.press("Digit3"); await p.waitForTimeout(250);
    await p.keyboard.press(allow ? "Digit1" : "Digit2");
    await p.waitForTimeout(400);
    continue;
  }
  if (s.dialogue) {
    await hold([]);
    if (s.dialogue.choices.length) {
      await shot("choice-ca" + (s.shift + 1) + "-" + shotN);
      const i = pickChoice(s.dialogue.choices);
      log("CHOOSE", s.dialogue.name, "->", s.dialogue.choices[i]);
      await p.keyboard.press("Digit" + (i + 1));
    } else {
      log("SAY", s.dialogue.name + ":", s.dialogue.text.slice(0, 90));
      await shot("dialogue-ca" + (s.shift + 1));
      await p.keyboard.press("KeyE");
    }
    await p.waitForTimeout(300);
    continue;
  }
  if (s.mode !== "play") { await hold([]); await p.waitForTimeout(200); continue; }
  if (s.prompt) { await hold([]); log("PROMPT", s.prompt); await p.keyboard.press("KeyE"); await p.waitForTimeout(400); continue; }
  if (s.chase) await shot("chase-ca" + (s.shift + 1) + "-" + Math.floor((Date.now() - startT) / 4000));
  if (!s.target || (s.chase && policy.noChase)) { await hold([]); await p.waitForTimeout(200); continue; }
  await shot("play-ca" + (s.shift + 1) + "-" + s.objective.slice(2, 30).replace(/\s+/g, "_"));
  await buildGrid();
  if (!path || Date.now() - pathT > (s.chase ? 300 : 1200)) { path = astar(s.x, s.z, s.target.x, s.target.z); pathT = Date.now(); }
  while (path.length > 1 && Math.hypot(path[0][0] - s.x, path[0][1] - s.z) < 0.6) path.shift();
  // look ahead: skip waypoints that are in a straight line
  const [wx, wz] = path[Math.min(1, path.length - 1)] && Math.hypot(path[0][0] - s.x, path[0][1] - s.z) < 1.2 ? path[Math.min(1, path.length - 1)] : path[0];
  const d = angleTo(s, wx, wz);
  if (lastPos && Math.hypot(s.x - lastPos[0], s.z - lastPos[1]) > 0.3) { lastProgress = Date.now(); lastPos = [s.x, s.z]; }
  if (!lastPos) lastPos = [s.x, s.z];
  const keys = [];
  if (Date.now() - lastProgress > 2500) { unstick = Date.now() + 600; lastProgress = Date.now(); path = null; }
  if (Date.now() < unstick) keys.push("KeyS", Math.random() < 0.5 ? "KeyA" : "KeyD");
  else {
    if (d > 0.12) keys.push("ArrowLeft"); else if (d < -0.12) keys.push("ArrowRight");
    if (Math.abs(d) < 0.9) keys.push("KeyW");
    if (s.chase && Math.abs(d) < 0.6) keys.push("ShiftLeft");
  }
  await hold(keys);
  await p.waitForTimeout(40);
}
await hold([]);
await p.waitForTimeout(500);
await shot("final", false);
const ls = await p.evaluate(() => JSON.stringify(localStorage));
log("localStorage", ls);
await b.close();
