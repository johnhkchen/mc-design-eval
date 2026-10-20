import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 彩虹橋 (Rainbow Bridge): a 1990s-style reinforced-concrete deck bridge with a
// steel-and-concrete rainbow arch over the deck. Piers are stone bricks, the deck
// is light concrete with a gray kerb, the rails are iron bars, and the arch ribs
// are stacked colour bands, one per 2 blocks of height.

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${base}/OSMw1341343912.cells.json`, "utf8"));

const W = 144, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.floor(gr));
}
const inFp = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DECK_LOW = 8;   // gray concrete beam/deck underside
const DECK_TOP = 9;   // light concrete running surface
const RAIL_Y = 10;    // railing course, roof reads ~11 with lanterns

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Deck slab across the whole footprint.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  put(x, DECK_LOW, z, "gray_concrete");
  put(x, DECK_TOP, z, "light_gray_concrete");
}

// 3. Abutments at both ends, full depth to deck underside.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x < 4 || x >= W - 4) {
    for (let y = 0; y < DECK_LOW; y++) put(x, y, z, "stone_bricks");
  }
}

// 4. Piers every 12 blocks under the two rib lines.
const pierX = [];
for (let x = 6; x < W - 4; x += 12) pierX.push(x);
for (const px of pierX) {
  for (const pz of [2, 3, 14, 15]) {
    if (!inFp(px, pz)) continue;
    for (let y = 0; y < DECK_LOW; y++) put(px, y, pz, "stone_bricks");
  }
}

// 5. Railings along both long edges, with lantern posts.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z === 0 || z === D - 1) {
    if (x % 12 === 6) {
      put(x, RAIL_Y, z, "stone_brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
      put(x, RAIL_Y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    } else {
      put(x, RAIL_Y, z, "iron_bars");
    }
  }
}

// 6. Rainbow arch ribs: parabola from deck end (~y9) to apex (y22).
const RIB_Z = [2, 3, 14, 15];
const BANDS = [
  "red_concrete",         // 10-11
  "orange_concrete",      // 12-13
  "yellow_concrete",      // 14-15
  "lime_concrete",        // 16-17
  "light_blue_concrete",  // 18-19
  "blue_concrete",        // 20-21
  "purple_concrete",      // 22
];
const colourFor = (y) => BANDS[Math.min(BANDS.length - 1, Math.max(0, Math.floor((y - 10) / 2)))];

const archH = (x) => {
  const t = (x + 0.5 - W / 2) / (W / 2);
  return 9 + 13 * (1 - t * t);
};

for (let x = 0; x < W; x++) {
  const h = archH(x);
  const hi = Math.round(h);
  const lo = Math.max(RAIL_Y, Math.round(h) - 2);
  if (hi < RAIL_Y) continue;
  for (const z of RIB_Z) {
    if (!inFp(x, z)) continue;
    for (let y = lo; y <= hi; y++) put(x, y, z, colourFor(y));
  }
}

// 7. Hangers: thin iron bars from deck to the arch, between piers.
for (let x = 12; x < W - 8; x += 12) {
  const hi = Math.round(archH(x));
  const lo = Math.max(RAIL_Y, hi - 2);
  for (const z of [3, 14]) {
    if (!inFp(x, z)) continue;
    for (let y = RAIL_Y; y < lo; y++) put(x, y, z, "iron_bars");
  }
}

// 8. Apex lights: glowstone set into the ribs at mid-span.
const mid = Math.floor(W / 2);
for (const z of RIB_Z) {
  if (!inFp(mid, z)) continue;
  put(mid, Math.round(archH(mid)) + 1 > H - 1 ? H - 1 : Math.round(archH(mid)) + 1, z, "shroomlight");
}

g.save(`${base}/OSMw1341343912.nbt`);
