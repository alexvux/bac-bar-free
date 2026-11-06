import * as THREE from "three";
import { renderer, scene, camera, clearLevel, lights, floor, room, box, person } from "./engine.js";
import { input, buildTouchControls, requestLock } from "./input.js";
import { player, placePlayer, updatePlayer } from "./player.js";

const ui = document.createElement("div");
ui.id = "ui";
ui.innerHTML = `<div id="stamina"><div></div></div>`;
document.body.appendChild(ui);
buildTouchControls(document.body);

clearLevel();
lights();
floor(0, 0, 40, 40, 0x7a8a5a);
room(0, 0, 12, 10, 3, 0xe8d8a8, { s: [0, 2] });
box(3, 0, -2, 1, 1, 1, 0x996633);
person({ shirt: 0xaa3333 }).position.set(-2, 0, -2);
placePlayer(0, 8, 0);

renderer.domElement.addEventListener("click", requestLock);
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  updatePlayer(dt);
  ui.querySelector("#stamina div").style.width = player.stamina * 100 + "%";
  renderer.render(scene, camera);
});
