// SPDX-License-Identifier: AGPL-3.0-or-later
// Chimneys, hearths and lights: chimney E and S with signal campfires, first-floor hearth, wing range, aisle and entrance lanterns.
import { chimneyStack, hearth, hangLantern } from "../vocab.mjs";

/** Lit, signal-fire campfire on a stack top: the helper sets lit and facing; the signal_fire state is ours to write. */
function signalCampfire(g, x, y, z) {
  g.set(x, y, z, "campfire", { facing: "north", lit: "true", signal_fire: "true" });
}

/** Cells the shell already fills with spruce_slab (earlier parts are locked): the breast leaves them as they are. */
const SHELL_OWNED = new Set(["21,21,13", "21,21,14"]);

/** Cells the main roof's gable already fills with slates (the roof part runs before this one): the cap ring leaves them. */
const ROOF_OWNED = new Set(["7,26,30", "8,26,30"]);

/** The grid as seen by a helper that must not write into earlier parts' cells: those writes are dropped, not refused. */
function leaveCells(g, owned) {
  return Object.assign(Object.create(g), {
    set: (x, y, z, ...rest) => { if (!owned.has(`${x},${y},${z}`)) g.set(x, y, z, ...rest); },
  });
}

export function build(g) {
  // Chimney E: 2x2 breast on its own footing at the east wall (plan CHIMNEY_E: x 20..21, z 13..14, y 5..31).
  // Band deepslate_bricks at y 29, hay at y 30, signal campfire at y 31, brick_slab cap ring at y 31.
  chimneyStack(leaveCells(g, SHELL_OWNED), 20, 13, 5, 29, 30, 31, { over: true });
  signalCampfire(g, 21, 31, 14);

  // Chimney S: wing kitchen stack against the south gable (plan CHIMNEY_S: x 7..8, z 31..32, y 5..26).
  chimneyStack(leaveCells(g, ROOF_OWNED), 7, 31, 5, 24, 25, 26, { over: true });
  signalCampfire(g, 8, 26, 32);

  // First-floor hearth in the living room: firebox at x 18, z 13..14, rows y 14..15, lintel at y 16.
  hearth(g, 18, 14, 13, "west", { room: [9, 14, 7, 18, 17, 15] });

  // Wing range against the south wall: lit furnace and smoker, front to the room (north), y 6, brick hob above at y 7.
  g.set(7, 6, 29, "furnace", { facing: "north", lit: "true" });
  g.set(8, 6, 29, "smoker", { facing: "north", lit: "true" });
  g.set(7, 7, 29, "bricks");
  g.set(8, 7, 29, "bricks");

  // Aisle lanterns: each on an iron_chain hung from the y 13 floor, the lantern at y 9 (head clear of y 6..8 walking
  // height). Set low so the aisle floor at y 6 reads 8+ (a lantern at y 12 left it at 6..7).
  for (const [x, z] of [[12, 17], [12, 20], [16, 20]]) {
    for (let y = 10; y <= 12; y++) g.set(x, y, z, "iron_chain", { axis: "y" });
    hangLantern(g, x, 9, z);
  }

  // Entrance lanterns: the lobby lane (x 5, clear of the stair well at x 7..8), on chains like the aisle's so the lane
  // floor reads 8+ (the hood lanterns over the doors belong to the shopfront).
  for (const z of [7, 13, 19]) {
    for (let y = 10; y <= 12; y++) g.set(5, y, z, "iron_chain", { axis: "y" });
    hangLantern(g, 5, 9, z);
  }
}
