// DOM overlays: HUD, prompts, dialogue, ID check, full-screen cards. Each modal returns a Promise.
const root = document.getElementById("ui");
root.insertAdjacentHTML("beforeend", `
  <div id="hud">
    <div id="shiftName"></div>
    <div id="objective"></div>
  </div>
  <div id="retire"></div>
  <div id="compass"><div id="arrow">▲</div><span id="dist"></span></div>
  <div id="cross"></div>
  <div id="prompt"></div>
  <div id="timer"></div>
  <div id="toast"></div>
  <div id="dialogue"><div id="dlgName"></div><div id="dlgText"></div><div id="dlgChoices"></div><div id="dlgHint"></div></div>
  <div id="idcheck"></div>
  <div id="card"></div>
  <div id="flash"></div>
  <button id="btnPause" class="pausebtn">II</button>
`);
const $ = (id) => document.getElementById(id);

// Only one modal is active at a time; main.js forwards keys to it.
let active = null;
let armedAt = 0;
// Modals become active at once (so the game knows it is paused) but ignore keys for a moment,
// so the key press that opened them does not also answer them.
function activate(handlers, delay = 200) { active = handlers; armedAt = performance.now() + delay; }
export const modalActive = () => !!active;
export function modalKey(kind, n) {
  if (!active) return false;
  if (performance.now() < armedAt) return true;
  if (kind === "choice") active.choice?.(n);
  else active.action?.();
  return true;
}

export function setShiftName(t) { $("shiftName").textContent = t; }
export function setRetire(t) { $("retire").textContent = t; }
export function setObjective(t) { $("objective").textContent = t ? "▸ " + t : ""; }
export function setPrompt(t) { $("prompt").textContent = t || ""; $("prompt").style.opacity = t ? 1 : 0; }
export function setTimer(t) { $("timer").textContent = t || ""; }
export function showHud(on) { document.body.classList.toggle("playing", on); }

export function setCompass(angle, dist) {
  const c = $("compass");
  if (angle === null) { c.style.opacity = 0; return; }
  c.style.opacity = 1;
  $("arrow").style.transform = `rotate(${-angle}rad)`;
  $("dist").textContent = Math.round(dist) + " m";
}

let toastT = 0;
export function toast(text, ms = 2600) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("on"), ms);
}

export function flash(color = "#fff", ms = 120) {
  const f = $("flash");
  f.style.background = color;
  f.style.transition = "none";
  f.style.opacity = 0.8;
  requestAnimationFrame(() => { f.style.transition = `opacity ${ms * 3}ms`; f.style.opacity = 0; });
}

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

// One line of speech. Resolves when the player presses E / clicks.
export function say(name, text) {
  return new Promise((resolve) => {
    const d = $("dialogue");
    $("dlgName").textContent = name;
    $("dlgText").innerHTML = esc(text);
    $("dlgChoices").innerHTML = "";
    $("dlgHint").textContent = "E / chạm để tiếp ▸";
    d.classList.add("on");
    const done = () => { d.classList.remove("on"); d.onclick = null; active = null; resolve(); };
    activate({ action: done }, 180);
    d.onclick = () => { if (performance.now() >= armedAt) done(); };
  });
}

// Linear conversation: [[name, text], ...]
export async function talk(lines) {
  for (const [n, t] of lines) await say(n, t);
}

// A line followed by choices. Resolves with the chosen index.
export function choose(name, text, options) {
  return new Promise((resolve) => {
    const d = $("dialogue");
    $("dlgName").textContent = name;
    $("dlgText").innerHTML = esc(text);
    $("dlgHint").textContent = "Chọn bằng phím số hoặc chạm";
    const box = $("dlgChoices");
    box.innerHTML = options.map((o, i) => `<button class="choice" data-i="${i}"><b>${i + 1}</b> ${esc(o)}</button>`).join("");
    d.classList.add("on");
    const pick = (i) => {
      if (i < 0 || i >= options.length) return;
      d.classList.remove("on"); active = null; box.innerHTML = "";
      resolve(i);
    };
    box.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); pick(+b.dataset.i); }));
    d.onclick = null;
    activate({ choice: pick }, 180);
  });
}

// Draw a low-poly style portrait on a canvas (no image assets).
export function portrait(face, w = 120, h = 140) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = face.bg || "#c9d6e3"; g.fillRect(0, 0, w, h);
  g.fillStyle = face.shirt || "#335"; g.fillRect(w * 0.15, h * 0.78, w * 0.7, h * 0.22);
  g.fillStyle = face.skin || "#d9a77c"; g.fillRect(w * 0.42, h * 0.68, w * 0.16, h * 0.12);
  g.fillRect(w * 0.27, h * 0.25, w * 0.46, h * 0.46);
  g.fillStyle = face.hair || "#1a1a1a";
  if (face.hairStyle === "bald") g.fillRect(w * 0.27, h * 0.25, w * 0.46, h * 0.04);
  else g.fillRect(w * 0.25, h * 0.18, w * 0.5, h * 0.12);
  if (face.hairStyle === "long") { g.fillRect(w * 0.22, h * 0.2, w * 0.08, h * 0.45); g.fillRect(w * 0.7, h * 0.2, w * 0.08, h * 0.45); }
  g.fillStyle = "#111";
  g.fillRect(w * 0.35, h * 0.42, w * 0.08, h * 0.04); g.fillRect(w * 0.57, h * 0.42, w * 0.08, h * 0.04);
  if (face.glasses) { g.strokeStyle = "#111"; g.lineWidth = 3; g.strokeRect(w * 0.31, h * 0.38, w * 0.16, h * 0.1); g.strokeRect(w * 0.53, h * 0.38, w * 0.16, h * 0.1); }
  if (face.mustache) g.fillRect(w * 0.39, h * 0.56, w * 0.22, h * 0.04);
  if (face.scar) { g.strokeStyle = "#8a3b2b"; g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.62, h * 0.3); g.lineTo(w * 0.68, h * 0.5); g.stroke(); }
  g.fillStyle = "#7a3b30"; g.fillRect(w * 0.43, h * 0.6, w * 0.14, h * 0.025);
  return c;
}

/* ID check. doc = { title, rules: [..], fields: [[label, value, bad?]], photo, face, stamp, says, ask }.
   Resolves with true (cho qua) or false (từ chối). */
export function idCheck(doc) {
  return new Promise((resolve) => {
    const el = $("idcheck");
    el.innerHTML = `
      <div class="idwrap">
        <div class="idrules"><b>Quy định ca này</b><ul>${doc.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
        <div class="idrow">
          <div class="idcard">
            <div class="idtitle">${esc(doc.title)}</div>
            <div class="idbody"><div class="idphoto"></div>
              <table>${doc.fields.map(([l, v]) => `<tr><td>${esc(l)}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table>
            </div>
            ${doc.stamp ? `<div class="stamp">${esc(doc.stamp)}</div>` : `<div class="nostamp">(không có dấu)</div>`}
          </div>
          <div class="idperson"><div class="idlabel">Người trước mặt</div><div class="idreal"></div>
            <div class="idsays">“${esc(doc.says)}”</div></div>
        </div>
        <div class="idbtns">
          <button data-i="0" class="ok"><b>1</b> Cho qua</button>
          <button data-i="1" class="no"><b>2</b> Từ chối</button>
          ${doc.ask ? `<button data-i="2"><b>3</b> Hỏi thêm</button>` : ""}
        </div>
      </div>`;
    el.querySelector(".idphoto").appendChild(portrait(doc.photo));
    el.querySelector(".idreal").appendChild(portrait(doc.face));
    el.classList.add("on");
    let asked = false;
    const pick = (i) => {
      if (i === 2) {
        if (!doc.ask || asked) return;
        asked = true;
        el.querySelector(".idsays").textContent = "“" + doc.ask + "”";
        el.querySelector('[data-i="2"]').disabled = true;
        return;
      }
      if (i !== 0 && i !== 1) return;
      el.classList.remove("on"); active = null;
      resolve(i === 0);
    };
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.i)));
    activate({ choice: pick }, 200);
  });
}

/* Full-screen card (title screen, shift intro, summary, endings).
   buttons: array of labels. Resolves with the chosen index. */
export function card({ kicker = "", title = "", body = "", buttons = ["Tiếp tục"], cls = "" }) {
  return new Promise((resolve) => {
    const el = $("card");
    el.className = "on " + cls;
    el.innerHTML = `<div class="cardin">
      ${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ""}
      <h1>${esc(title)}</h1>
      <div class="cardbody">${body}</div>
      <div class="cardbtns">${buttons.map((b, i) => `<button data-i="${i}"><b>${buttons.length > 1 ? i + 1 : "E"}</b> ${esc(b)}</button>`).join("")}</div>
    </div>`;
    const pick = (i) => {
      if (i < 0 || i >= buttons.length) return;
      el.className = ""; el.innerHTML = ""; active = null;
      resolve(i);
    };
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => pick(+b.dataset.i)));
    activate({ choice: pick, action: buttons.length === 1 ? () => pick(0) : null }, 250);
  });
}

export function closeCard() { const el = $("card"); el.className = ""; el.innerHTML = ""; active = null; }

export const pauseButton = $("btnPause");
