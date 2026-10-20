import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058324";
const W = 12, H = 29, D = 31;
const TOP = 17;          // parapet top (exclusive): roof about 17 blocks above lowest ground
const ROOF_DECK = 15;    // top of the third storey, cornice line
const PH_ROOF = 18;      // penthouse roof

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const inFp = new Set();
const gr = new Map();
let base = Infinity;
for (const [x, z, gnd] of cells) {
  inFp.add(key(x, z));
  gr.set(key(x, z), gnd);
  base = Math.min(base, gnd);
}
const gOf = (x, z) => Math.max(0, Math.min(H - 1, gr.get(key(x, z)) - base));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward directions: missing neighbour tells which face a cell sits on.
const DIRS = [
  { dx: 1, dz: 0, face: "east" },
  { dx: -1, dz: 0, face: "west" },
  { dx: 0, dz: -1, face: "north" },
  { dx: 0, dz: 1, face: "south" },
];
const isEdgeCell = (x, z) => DIRS.some(d => !inFp.has(key(x + d.dx, z + d.dz)));
const allNbInFp = (x, z) => DIRS.every(d => inFp.has(key(x + d.dx, z + d.dz)));

// Windows: glazing on mid-storey rows, mullions every third bay.
const isWin = (len, i) => i > 0 && i < len - 1 && i % 3 !== 0;

// Pass 1: foundation, floors, walls, cornice, parapet, windows.
for (const k of gr.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = gOf(x, z);
  const miss = DIRS.filter(d => !inFp.has(key(x + d.dx, z + d.dz)));
  const edge = miss.length > 0;
  const corner = miss.length >= 2;
  const face = miss[0];

  for (let y = 0; y < TOP; y++) {
    if (y < gc) { put(x, y, z, "stone_bricks"); continue; }

    if (!edge) {
      // storey slabs, first slab on the cell's own ground, and the roof deck
      if (y % 5 === 0 || y === gc) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y === TOP - 1) { put(x, y, z, "white_concrete"); continue; }      // parapet
    if (y % 5 === 0 || corner) { put(x, y, z, "smooth_quartz"); continue; } // string course / pilasters
    if (y % 5 === 4) { put(x, y, z, "white_concrete"); continue; }          // spandrel

    // window band rows 1..3 of each storey
    const alongZ = face.face === "east" || face.face === "west";
    const i = alongZ ? z : x;
    const L = alongZ ? D : W;
    if (isWin(L, i)) {
      const props = alongZ
        ? { north: String(isWin(L, i - 1)), south: String(isWin(L, i + 1)), east: "false", west: "false", waterlogged: "false" }
        : { east: String(isWin(L, i + 1)), west: String(isWin(L, i - 1)), north: "false", south: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", props);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Pass 2: warm lights behind some windows (air gap sits between glass and light).
for (const k of gr.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdgeCell(x, z)) continue;
  const miss = DIRS.filter(d => !inFp.has(key(x + d.dx, z + d.dz)));
  if (miss.length !== 1) continue;
  const face = miss[0];
  const gc = gOf(x, z);
  const alongZ = face.face === "east" || face.face === "west";
  const i = alongZ ? z : x;
  const L = alongZ ? D : W;
  if (!isWin(L, i)) continue;
  const inward = { east: [-1, 0], west: [1, 0], north: [0, 1], south: [0, -1] }[face.face];
  const ix = x + inward[0], iz = z + inward[1];
  if (!inFp.has(key(ix, iz)) || !allNbInFp(ix, iz)) continue;
  for (let s = 0; s < 3; s++) {
    const y = 5 * s + 2;
    if (y < gc || y === gc) continue;
    const phase = (i + s) % 4;
    if (phase === 1) put(ix, y, iz, "glowstone");
    else if (phase === 3) put(ix, y, iz, "shroomlight");
  }
}

// Entrance on the east (street) face, centred on the long side.
const mid = Math.floor(D / 2);
if (inFp.has(key(W - 1, mid)) && !inFp.has(key(W, mid))) {
  const yd = gOf(W - 1, mid);
  const dp = { facing: "west", hinge: "left", open: "false", powered: "false" };
  put(W - 1, yd, mid, "dark_oak_door", { ...dp, half: "lower" });
  put(W - 1, yd + 1, mid, "dark_oak_door", { ...dp, half: "upper" });
  put(W - 2, yd + 1, mid, "glowstone");                      // lobby light behind door
  for (let z = mid - 2; z <= mid + 2; z++) {                  // awning over entrance
    if (inFp.has(key(W - 1, z)) && !inFp.has(key(W, z))) {
      put(W - 1, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 3: roof equipment and a small penthouse on the roof deck.
for (let x = 2; x <= 6; x++) {
  for (let z = 22; z <= 27; z++) {
    const edgeRing = x === 2 || x === 6 || z === 22 || z === 27;
    if (edgeRing) {
      put(x, ROOF_DECK + 1, z, "white_concrete");
      put(x, ROOF_DECK + 2, z, "white_concrete");
    }
    put(x, PH_ROOF, z, "smooth_stone");
  }
}
for (const [x, z] of [[8, 5], [9, 5], [8, 6], [9, 6]]) {
  put(x, ROOF_DECK + 1, z, "iron_block");                    // AC plant
}
put(2, ROOF_DECK + 1, 4, "iron_block");                       // water tank footing
put(3, ROOF_DECK + 1, 4, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
