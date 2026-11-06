// First-person guard: walking, sprinting with limited stamina, head bob, collision.
import { camera, collide } from "./engine.js";
import { input } from "./input.js";

export const player = {
  x: 0, z: 0, yaw: 0, pitch: 0,
  stamina: 1, // 0..1. Bác is 59: sprinting drains fast.
  tired: false, // when emptied, must recover to 0.35 before sprinting again
  speed: 0,
  bob: 0,
  radius: 0.35,
  frozen: false,
  drainMul: 1, // < 1 drains stamina slower (cô Thảo's cao dán in ca 5)
  onStep: null,
  stepAcc: 0,
};

const WALK = 3.0, SPRINT = 5.6, EYE = 1.62;

export function placePlayer(x, z, yaw = 0) {
  Object.assign(player, { x, z, yaw, pitch: 0, stamina: 1, tired: false });
  updateCamera();
}

export function updatePlayer(dt) {
  const k = input.keys;
  // Look: mouse / touch deltas plus arrow keys for keyboard-only players.
  player.yaw -= input.lookDX * 0.0025;
  player.pitch -= input.lookDY * 0.0025;
  input.lookDX = input.lookDY = 0;
  if (!player.frozen) {
    if (k.has("ArrowLeft") || k.has("KeyQ")) player.yaw += 2.4 * dt;
    if (k.has("ArrowRight")) player.yaw -= 2.4 * dt;
  }
  player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch));

  let fx = 0, fz = 0;
  if (!player.frozen) {
    if (k.has("KeyW") || k.has("ArrowUp")) fz += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) fz -= 1;
    if (k.has("KeyA")) fx -= 1;
    if (k.has("KeyD")) fx += 1;
    fx += input.move.x; fz -= input.move.y;
  }
  const len = Math.hypot(fx, fz);
  if (len > 1) { fx /= len; fz /= len; }
  const moving = len > 0.05;
  const wantSprint = (k.has("ShiftLeft") || k.has("ShiftRight") || input.touchSprint) && moving && fz > 0;
  const sprinting = wantSprint && !player.tired && player.stamina > 0;
  if (sprinting) {
    player.stamina -= (dt / 3.2) * player.drainMul;
    if (player.stamina <= 0) { player.stamina = 0; player.tired = true; }
  } else {
    player.stamina = Math.min(1, player.stamina + dt / (player.tired ? 5 : 3.5));
    if (player.tired && player.stamina > 0.35) player.tired = false;
  }
  const target = moving ? (sprinting ? SPRINT : player.tired ? WALK * 0.75 : WALK) * Math.max(len, 0.4) : 0;
  player.speed += (target - player.speed) * Math.min(1, dt * 10);

  const sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
  // forward = (-sin, -cos), right = (cos, -sin)
  const n = len > 0 ? 1 / len : 0;
  const vx = (-sin * fz + cos * fx) * n * player.speed;
  const vz = (-cos * fz - sin * fx) * n * player.speed;
  let nx = player.x + vx * dt;
  let nz = player.z + vz * dt;
  [nx, nz] = collide(nx, nz, player.radius);
  player.x = nx; player.z = nz;

  if (moving && player.speed > 0.5) {
    player.bob += dt * player.speed * 2.6;
    player.stepAcc += dt * player.speed;
    if (player.stepAcc > 1.6) { player.stepAcc = 0; player.onStep?.(sprinting); }
  }
  updateCamera();
}

function updateCamera() {
  camera.position.set(player.x, EYE + Math.sin(player.bob) * 0.045, player.z);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

export function distTo(x, z) {
  return Math.hypot(player.x - x, player.z - z);
}

// Angle between the camera's forward direction and the point, in radians.
export function angleTo(x, z) {
  const a = Math.atan2(-(x - player.x), -(z - player.z));
  let d = a - player.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
