import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1300 6th St NW: a red-brick walk-up apartment block of the 1900s-20s (Shaw / Mount Vernon Square). Street front on the
// z = 0 face: a 3-wide central bay rises one storey above the two flanking wings, a classic pavilion on a stone plinth,
// with a stone parapet, brick piers, glazed bays and a recessed entry under a stone lintel.
const ROOT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${ROOT}/DC75259.cells.json`, "utf8"));

const W = 7, D = 11, Y = 17;

// Lidar roof heights: the 5s are the central band x 2..4 (all the way front to back); the wings are 4. The two 5s at
// (0,7),(0,8) are a single-column bump on the west side wall, lidar noise, so they take the wing tier.
const roofAt = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, , r] of cells) roofAt[x][z] = r;
const h = (x, z) => (x >= 2 && x <= 4 ? 5 : 4);
for (const [x, z, ground] of cells) if (ground !== 0) throw new Error(`ground not flat at ${x},${z}`);

const BODY = "bricks", TRIM = "stone_bricks", FILL = "stone", ROOF = "gravel", PANE = "glass_pane";
const frontPane = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const sidePane = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
// about one window in five has a glowstone lamp set in its recess behind the pane
const lit = (x, y, z) => (x * 3 + y * 5 + z * 2) % 5 === 0;

const g = new Voxels([W, Y, D]);

// 1. the solid mass and the roof cover: interior is solid (no rooms), its top cell is gravel
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const hh = h(x, z);
  for (let y = 0; y < hh; y++) {
    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    if (perim) continue;
    g.set(x, y, z, y === hh - 1 ? ROOF : FILL);
  }
}

// 2. the shell: plinth, quoins, parapet, brick piers and glazed bays
// street front: a window in each wing (x 1, 5) on the two floors, brick piers at x 2 and 4 beside the entry, and the
// pavilion's top floor glazed across x 2..4; the back gets the same rhythm with a window on the centre line too
const frontWindow = (x, y) => (y >= 1 && y <= 2 && (x === 1 || x === 5)) || (y === 3 && x >= 2 && x <= 4);
const backWindow = (x, y) => (y >= 1 && y <= 2 && (x === 1 || x === 3 || x === 5)) || (y === 3 && x >= 2 && x <= 4);
const sideWindow = (z, y) => [2, 3, 7, 8].includes(z) && y >= 1;
const pockets = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const hh = h(x, z);
  const edgeX = x === 0 || x === W - 1, edgeZ = z === 0 || z === D - 1;
  if (!edgeX && !edgeZ) continue;
  const corner = edgeX && edgeZ;
  for (let y = 0; y < hh; y++) {
    const front = z === 0, back = z === D - 1, side = edgeX && !edgeZ;
    let block = BODY, state, win = false;
    if (y === 0) block = TRIM;                       // base course
    else if (y === hh - 1) block = TRIM;             // parapet / cornice
    else if (corner) block = TRIM;                   // quoins
    else if (front && x === 3 && y === 2) block = TRIM; // lintel over the entrance
    else if (front && frontWindow(x, y)) win = true;
    else if (back && backWindow(x, y)) win = true;
    else if (side && sideWindow(z, y)) win = true;
    if (win) { block = PANE; state = front || back ? frontPane : sidePane; pockets.push({ x, y, z, front: front || back }); }
    g.set(x, y, z, block, state);
  }
}

// 3. the recesses behind the glass (an air gap, or a lamp) and the entrance
for (const { x, y, z, front } of pockets) {
  const px = front ? x : (x === 0 ? 1 : W - 2), pz = front ? (z === 0 ? 1 : D - 2) : z;
  g.set(px, y, pz, lit(x, y, z) ? "glowstone" : "air");
}
g.set(3, 0, 0, "oak_door", doorState("lower"));
g.set(3, 1, 0, "oak_door", doorState("upper"));
g.set(3, 0, 1, "air");                        // entry hall, one cell deep
g.set(3, 1, 1, "glowstone");                   // warm light over the door

// 4. roof equipment on the wings' gravel and a lamp on the stair core
g.set(1, 4, 3, "iron_block");
g.set(5, 4, 7, "iron_block");
g.set(3, 4, 5, "lantern", { hanging: "false", waterlogged: "false" });

const out = g.save(`${ROOT}/DC75259.nbt`);
console.log(JSON.stringify({ roofMax: Math.max(...roofAt.flat()), ...out }));
