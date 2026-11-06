// Keyboard, mouse look and on-screen touch controls, merged into one input state.
export const input = {
  keys: new Set(),
  move: { x: 0, y: 0 }, // touch joystick, -1..1
  lookDX: 0, lookDY: 0, // accumulated look delta (pixels) consumed by the player each frame
  touchSprint: false,
  enabled: true,
  onAction: null, // E / touch E
  onPause: null,
  onChoice: null, // number keys 1-4
};

const canvasEl = () => document.querySelector("canvas");

window.addEventListener("keydown", (e) => {
  if (e.repeat && (e.code === "KeyE" || e.code === "Space")) return;
  input.keys.add(e.code);
  if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") input.onAction?.(e.code);
  if (e.code === "Escape" || e.code === "KeyP") input.onPause?.();
  const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
  if (n !== undefined) input.onChoice?.(n);
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => input.keys.delete(e.code));
window.addEventListener("blur", () => input.keys.clear());

window.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement) {
    input.lookDX += e.movementX;
    input.lookDY += e.movementY;
  }
});

export function requestLock() {
  const c = canvasEl();
  if (c && !isTouch() && c.requestPointerLock) {
    try { const p = c.requestPointerLock(); p?.catch?.(() => {}); } catch {}
  }
}

export function isTouch() {
  return new URLSearchParams(location.search).has("touch") || matchMedia("(pointer: coarse)").matches;
}

// Builds the joystick, look pad and buttons. Only shown on touch devices (or ?touch).
export function buildTouchControls(root) {
  const wrap = document.createElement("div");
  wrap.id = "touch";
  wrap.innerHTML = `
    <div id="joy"><div id="joyKnob"></div></div>
    <div id="lookPad"></div>
    <button id="btnAct" class="tbtn">E</button>
    <button id="btnRun" class="tbtn">Chạy</button>`;
  root.appendChild(wrap);
  if (isTouch()) document.body.classList.add("touch");

  const joy = wrap.querySelector("#joy"), knob = wrap.querySelector("#joyKnob");
  let joyId = null, cx = 0, cy = 0;
  joy.addEventListener("pointerdown", (e) => {
    joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch {}
    const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    moveJoy(e);
  });
  const moveJoy = (e) => {
    if (e.pointerId !== joyId) return;
    let dx = (e.clientX - cx) / 50, dy = (e.clientY - cy) / 50;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    input.move.x = dx; input.move.y = dy;
    knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  joy.addEventListener("pointermove", moveJoy);
  const endJoy = (e) => { if (e.pointerId !== joyId) return; joyId = null; input.move.x = input.move.y = 0; knob.style.transform = ""; };
  joy.addEventListener("pointerup", endJoy);
  joy.addEventListener("pointercancel", endJoy);

  const pad = wrap.querySelector("#lookPad");
  let lookId = null, lx = 0, ly = 0;
  pad.addEventListener("pointerdown", (e) => { lookId = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch {} lx = e.clientX; ly = e.clientY; });
  pad.addEventListener("pointermove", (e) => {
    if (e.pointerId !== lookId) return;
    input.lookDX += (e.clientX - lx) * 2.2; input.lookDY += (e.clientY - ly) * 2.2;
    lx = e.clientX; ly = e.clientY;
  });
  const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
  pad.addEventListener("pointerup", endLook);
  pad.addEventListener("pointercancel", endLook);

  wrap.querySelector("#btnAct").addEventListener("pointerdown", (e) => { e.preventDefault(); input.onAction?.("touch"); });
  const run = wrap.querySelector("#btnRun");
  run.addEventListener("pointerdown", (e) => { e.preventDefault(); input.touchSprint = true; run.classList.add("on"); });
  const stopRun = () => { input.touchSprint = false; run.classList.remove("on"); };
  run.addEventListener("pointerup", stopRun);
  run.addEventListener("pointercancel", stopRun);
}
