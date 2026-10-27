// Way 326735502: a two-storey brick shop-top block (1920s Auckland main-street type) on a stone plinth, with a white
// string course, cornice and coping, a shopfront with a dark oak door on its north (street) side, and an air gap
// behind every window. The lidar roof is smoothed into two flat tiers (12 and 13) so the parapet steps once.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735502.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roofRaw.set(key(x, z), r); }
const inside = (x, z) => ground.has(key(x, z));

// Lidar roof heights jitter by a block from cell to cell: average each cell's 3x3 patch and snap to the tier 12 or 13.
const top = new Map();
for (const [x, z] of cells) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = key(x + dx, z + dz); if (roofRaw.has(k)) { s += roofRaw.get(k); n++; }
  }
  top.set(key(x, z), s / n >= 12.5 ? 13 : 12);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FLOOR = 3;                   // ground-floor slab band; the plinth below is stone (and fills any slope)
const STOREY = [[4, 6], [8, 10]];  // window bands: shopfront, then the upper storey
const SLAB = 7, CORNICE = 11;      // white string courses between and above the storeys
const DOOR = { x: 2, z: 0 };       // on the north (street) face
const inBand = (y) => STOREY.some(([a, b]) => y >= a && y <= b);

const faceOf = (x, z) => Object.keys(DIRS).filter(d => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const inwardOf = (x, z, face) => [x - DIRS[face][0], z - DIRS[face][1]];
// a window needs a cell behind it for the air gap, and sits on every bay that isn't a pier (every third cell)
const windowable = (x, z, face) => {
  const idx = face === "N" || face === "S" ? x : z;
  const [ix, iz] = inwardOf(x, z, face);
  return idx % 3 !== 0 && inside(ix, iz);
};
// glass panes connect along the wall they sit in
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([15, 26, 9]);
const windows = [];                // { x, z, face } for the air-gap pass

for (const [x, z] of cells) {
  const t = top.get(key(x, z));
  const faces = faceOf(x, z);
  const perim = faces.length >= 1;
  const face = faces[0];
  const win = perim && windowable(x, z, face);
  const isDoor = win && face === "N" && x === DOOR.x && z === DOOR.z;
  if (win) windows.push({ x, z, face });

  for (let y = 0; y < t; y++) {
    let block = "bricks", state;
    if (y < FLOOR) block = "stone_bricks";
    if (perim) {
      if (y === FLOOR) block = "smooth_stone";
      if (y === SLAB || y === CORNICE) block = "white_terracotta";
      if (y === t - 1) block = "white_terracotta";                 // coping
    } else if (y === t - 1) block = "gray_concrete";                // flat roof membrane
    if (win && inBand(y)) { block = "glass_pane"; state = paneState(face); }
    if (isDoor && (y === STOREY[0][0] || y === STOREY[0][0] + 1)) {
      block = "dark_oak_door";
      state = doorState(y === STOREY[0][0] ? "lower" : "upper");
    }
    if (block === "air") continue;
    g.set(x, y, z, block, state);
  }
}

// Air gaps behind the glass (one cell in), with a warm light on the sill of some windows.
for (const w of windows) {
  const [ix, iz] = inwardOf(w.x, w.z, w.face);
  for (const [a, b] of STOREY) for (let y = a; y <= b; y++) g.set(ix, y, iz, "air");
  if (w.face !== "N" || w.x !== DOOR.x || w.z !== DOOR.z) {
    if ((w.x + w.z) % 4 === 0) g.set(ix, 8, iz, "glowstone");      // upper storey
    else if ((w.x + w.z) % 5 === 1) g.set(ix, 4, iz, "glowstone");  // shopfront
  }
}

// Roof plant on the top tier (interior cells only), each standing on the roof membrane.
for (const [x, z] of [[9, 5], [10, 5], [12, 6]]) {
  if (top.get(key(x, z)) === 13 && faceOf(x, z).length === 0) g.set(x, 13, z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735502.nbt";
console.log(g.save(out));
