import { buildTouchControls } from "./input.js";
import { player } from "./player.js";
import { audio } from "./audio.js";

const ui = document.createElement("div");
ui.id = "ui";
ui.innerHTML = `<div id="stamina"><div></div></div>`;
document.body.appendChild(ui);
buildTouchControls(document.body);
player.onStep = (run) => audio.step(run);

// ui.js builds its DOM into #ui at import time, so load the game after #ui exists.
const { titleScreen } = await import("./game.js");
titleScreen();
