import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499454.cells.json`, "utf8"));

const W = 15, D = 8, H = 26;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => map.has(`${x},${z}`);

let Yf = 0, R = 0;
for (const c of map.values()) { Yf = Math.max(Yf, c.g); R = Math.max(R, c.r); }
const Ye = Yf + 5;
R = Math.min(H - 1, Math.max(R, Ye + 3));
const rise = R - Ye;

function topZ(z) {
  const d = Math.abs(z - 3.5);
  const t = d <= 0.5 ? 1 : d >= 3.5 ? 0 : 1 - (d - 0.5) / 3;
  return Ye + Math.max(1, Math.round(rise * t));
}

const g = new Voxels([W, H, D]);
const SPR = "spruce_planks", LOG = "stripped_spruce_log", ROOF = "deepslate_tiles";
const BASE = "stone_bricks", FOUND = "cobblestone", SLATE_SLAB = "stone_brick_slab";
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Massing: foundation, base course, shell walls, open interior, roof.
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  for (let y = 0; y < Yf; y++) g.set(x, y, z, FOUND);
  g.set(x, Yf, z, BASE);

  if (perim) {
    for (let y = Yf + 1; y <= Ye - 1; y++) g.set(x, y, z, SPR);
  }

  const t = topZ(z);
  for (let y = Ye; y < t; y++) {
    g.set(x, y, z, (x === 0 || x === W - 1) ? SPR : ROOF);
  }
}

// 2. Corner posts.
for (const x of [0, W - 1]) for (const z of [0, D - 1]) {
  if (!has(x, z)) continue;
  for (let y = Yf + 1; y <= Ye - 1; y++) g.set(x, y, z, LOG);
}

// 3. Timber framing: storey beam at Yf+1 is the sill course, a head beam at Ye-1 closes the wall,
//    and studs break the long faces between the windows.
for (const [key] of map) {
  const [x, z] = key.split(",").map(Number);
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!perim) continue;
  if (z === 0 || z === D - 1) {
    g.set(x, Ye - 1, z, LOG);                 // head beam / cornice band
  }
}
// Stud posts on the long faces, clear of windows, door and corners.
for (const z of [0, D - 1]) for (const x of [1, 6, 8, 13]) {
  if (z === 0 && (x === 6 || x === 8)) continue; // door jambs already present
  for (let y = Yf + 1; y <= Ye - 2; y++) {
    if (x === 1 || x === 13) { g.set(x, y, z, LOG); continue; }
    g.set(x, y, z, LOG);
  }
}
// Side faces: head beam under the eave.
for (const x of [0, W - 1]) for (let z = 1; z <= 6; z++) g.set(x, Ye - 1, z, LOG);

// 4. Window bays on the long faces: glass with stripped-log frame.
function bay(z, x0, x1) {
  for (let x = x0; x <= x1; x++) for (let y = Yf + 2; y <= Yf + 3; y++) g.set(x, y, z, "glass_pane", PANE_X);
  for (const x of [x0 - 1, x1 + 1]) for (let y = Yf + 2; y <= Yf + 3; y++) g.set(x, y, z, LOG);
  for (let x = x0 - 1; x <= x1 + 1; x++) {
    g.set(x, Yf + 1, z, LOG);
    g.set(x, Yf + 4, z, LOG);
  }
}
for (const z of [0, D - 1]) {
  bay(z, 2, 4);
  bay(z, 10, 12);
}

// 5. Entrance on the street face (z=0): door, jambs, lintel, and a canopy slab.
for (const x of [6, 8]) for (let y = Yf + 1; y <= Yf + 3; y++) g.set(x, y, 0, LOG);
for (let x = 6; x <= 8; x++) g.set(x, Yf + 4, 0, LOG);
g.set(7, Yf + 1, 0, "spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(7, Yf + 2, 0, "spruce_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(7, Yf + 5, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 6. Side-gable windows on the short faces.
for (const x of [0, W - 1]) {
  for (let z = 2; z <= 5; z++) for (let y = Yf + 2; y <= Yf + 3; y++) g.set(x, y, z, "glass_pane", PANE_Z);
  for (const z of [1, 6]) for (let y = Yf + 2; y <= Yf + 3; y++) g.set(x, y, z, LOG);
  for (let z = 1; z <= 6; z++) {
    g.set(x, Yf + 1, z, LOG);
    g.set(x, Yf + 4, z, LOG);
  }
}

// 7. Warm light behind front glass.
g.set(3, Yf + 2, 1, "glowstone");
g.set(11, Yf + 2, 1, "glowstone");
g.set(3, Yf + 2, 6, "shroomlight");

// 8. Brick chimney from the ridge (x=10..11, z=3..4), with a slab cap.
for (const x of [10, 11]) for (const z of [3, 4]) {
  for (let y = R; y <= Math.min(H - 2, R + 3); y++) g.set(x, y, z, "bricks");
  if (R + 4 <= H - 1) g.set(x, R + 4, z, SLATE_SLAB, { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/FR301499454.nbt`);
