// FR245184542: Hôtel de la Motte Montgoubert, a 17th-century hôtel particulier: five storeys of pale limestone (calcite) over a
// stone plinth, smooth-quartz string courses and lintels, a slate mansard over the five-storey core, and flat stone terraces
// with brick chimneys over the lower wings. Storeys are 5 blocks (floor string, three window rows, lintel), so the storey lines
// fall on y = 4 mod 5 and every tier top (9, 14, 19, 24, 29) is a lintel row that carries the next thing up.
// Walls are one block thick: the outer ring is the facade, the cells behind a window are air (the gap), and the storey floors
// and lintels are solid across the footprint, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184542.cells.json`, "utf8"));

const X = 42, Y = 44, Z = 70;
const PLINTH = 4;                                    // the ground floor's floor line; everything below is stone plinth
const TIERS = [4, 9, 14, 19, 24, 29];                // 4 = plinth only (low walls); the rest are storeyed tops
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const key = (x, z) => `${x},${z}`;
const fp = new Map();                                // "x,z" -> { top }: the lidar roof snapped to a tier
for (const [x, z, , roof] of cells) {
  const top = TIERS.reduce((best, t) => (Math.abs(t - roof) < Math.abs(best - roof) ? t : best));
  fp.set(key(x, z), { top });
}
const topOf = (x, z) => fp.get(key(x, z))?.top ?? 0; // no building beside the footprint: open air
const exposedDirs = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => topOf(x + dx, z + dz) <= y).map(([n]) => n);

// Distance inward from the edge of each tier's own cells (edge = 0), so a cap or chimney sits clear of the parapet.
const dist = new Map();
for (const T of TIERS) {
  const same = [...fp.keys()].filter((k) => fp.get(k).top === T).map((k) => k.split(",").map(Number));
  const queue = [];
  for (const [x, z] of same) {
    if (Object.values(DIRS).some(([dx, dz]) => topOf(x + dx, z + dz) !== T)) { dist.set(key(x, z), 0); queue.push([x, z]); }
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i], d = dist.get(key(x, z));
    for (const [dx, dz] of Object.values(DIRS)) {
      const k = key(x + dx, z + dz);
      if (topOf(x + dx, z + dz) === T && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
    }
  }
}

// The street front: the face with the most storey-one wall (ties go north), its door at the middle of that run.
const faceCount = {};
for (const [k, { top }] of fp) {
  if (top < 9) continue;
  const [x, z] = k.split(",").map(Number);
  for (const d of exposedDirs(x, z, 5)) faceCount[d] = (faceCount[d] ?? 0) + 1;
}
const doorDir = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a] || (a === "north" ? -1 : 1))[0];
const [ddx, ddz] = DIRS[doorDir];
const doorRun = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => {
  const top = topOf(x, z);
  return top >= 9 && exposedDirs(x, z, 5).includes(doorDir) && exposedDirs(x - ddx, z - ddz, 5).length === 0;
});
const along = (x, z) => (ddx !== 0 ? z : x);       // along the face: z on an east/west front, x on a north/south one
doorRun.sort((a, b) => along(...a) - along(...b));
const [doorX, doorZ] = doorRun[Math.floor(doorRun.length / 2)];
const doorKey = key(doorX, doorZ);

// A window: a middle pair of each four-block bay on the face (piers at the ends), with the cell behind it open air.
const windowOK = (x, z, y, d) => {
  const [dx, dz] = DIRS[d];
  if (exposedDirs(x - dx, z - dz, y).length) return false;   // no room behind: a wall, not a window
  const u = dx !== 0 ? z : x;
  return [1, 2].includes(((u % 4) + 4) % 4);
};

// The block at a footprint cell, rows 0..3 of the plinth and storeys; null is air (an interior room, or above the tier).
function cls(x, z, y) {
  const top = topOf(x, z); if (!top || y >= top) return null;
  const exp = exposedDirs(x, z, y);
  if (y === top - 1) return { block: exp.length ? "smooth_quartz" : "stone_bricks" };   // parapet ring and the roof deck
  if (y < PLINTH) return { block: "stone_bricks" };                                    // the plinth, down to the ground
  const row = (y - PLINTH) % 5;                                                       // 0 floor string, 1-3 windows, 4 lintel
  if (row === 0 || row === 4) return { block: exp.length ? "smooth_quartz" : "oak_planks" };
  if (!exp.length) return null;                                                       // a room behind the facade
  if (x === doorX && z === doorZ) {
    if (y === 5) return { block: "dark_oak_door", state: { facing: doorDir, half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (y === 6) return { block: "dark_oak_door", state: { facing: doorDir, half: "upper", hinge: "left", open: "false", powered: "false" } };
    return { block: "smooth_quartz" };                                                // the transom over the door
  }
  const d = exp.length === 1 ? exp[0] : null;
  if (d && windowOK(x, z, y, d)) {
    const ns = d === "north" || d === "south";                                        // a pane runs along a wall's plane
    return { block: "light_blue_stained_glass_pane", state: { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns) } };
  }
  return { block: "calcite" };
}

const g = new Voxels([X, Y, Z]);
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < Y; y++) {
    const c = cls(x, z, y); if (!c) continue;
    g.set(x, y, z, c.block, c.state);
  }
}

// Mansard: the five-storey core's slate cap, stepping in from the parapet (one block at the first course, three at the second).
for (const [k, { top }] of fp) {
  if (top !== 29) continue;
  const [x, z] = k.split(",").map(Number), d = dist.get(k) ?? 0;
  if (d >= 1) g.set(x, 29, z, "deepslate_tiles");
  if (d >= 3) g.set(x, 30, z, "deepslate_tiles");
}

// Brick chimneys on the lower terraces, set well inside the parapet and standing on the deck.
for (const [k, { top }] of fp) {
  if (top !== 19 && top !== 24) continue;
  const [x, z] = k.split(",").map(Number);
  if ((dist.get(k) ?? 0) >= 2 && x % 9 === 4 && z % 11 === 5) for (let y = top; y < top + 3; y++) g.set(x, y, z, "bricks");
}

// Lanterns hanging in the room behind some windows, from the lintel above.
for (const [k, { top }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let s = 0; PLINTH + 5 * s + 8 < top; s++) {
    if ((x + z + s) % 3 !== 0) continue;
    for (const d of Object.keys(DIRS)) {
      const [dx, dz] = DIRS[d], y = PLINTH + 5 * s + 3;
      if (exposedDirs(x, z, y).length !== 1 || !exposedDirs(x, z, y).includes(d)) continue;
      if (!windowOK(x, z, y, d)) continue;
      const ix = x - dx, iz = z - dz;
      if (ix === doorX && iz === doorZ) continue;
      g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
      break;
    }
  }
}

const info = g.save(`${DIR}/FR245184542.nbt`);
console.log(`FR245184542: ${info.blocks} blocks, ${info.palette} palette entries, door on the ${doorDir} front`);
