// Way 948317541, Mt Eden village edge: a 1930s plastered-brick shop-and-flats block. Three tiers from the lidar roof
// (wings to y6, mid to y10, core to y14 = three 4-block storeys plus a cornice course), a stone plinth on the downhill
// side, a cream plaster skin with piers, glass panes and warm glowstone behind some windows, a shopfront and a doorway
// on the north wing, and a plant room on the core roof. Every tier stands on the floor below; no interiors (air behind
// the glass, a floor slab per storey).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317541.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317541.nbt";
const [W, H, D] = [18, 26, 20];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roof = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, r]));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the lidar roof snapped to three flat tiers: wings 6, mid 10, core 14. A core cell needs two core neighbours, so the
// scattered 11-13 readings don't leave one-block spikes; the core is the compact cluster that is left
const hi = (x, z) => (roof.get(`${x},${z}`) ?? 0) >= 11;
const coreCell = (x, z) => hi(x, z) && NB.filter(([a, b]) => hi(x + a, z + b)).length >= 2;
const foot = new Map();
for (const [x, z, g, r] of cells) {
  foot.set(`${x},${z}`, { x, z, g, t: coreCell(x, z) ? 14 : r <= 6 ? 6 : 10 });
}
const cellAt = (x, z) => foot.get(`${x},${z}`);
// a perimeter cell has a neighbour outside the footprint or on another tier, so its walls stand
const isPerim = (c) => NB.some(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || n.t !== c.t; });
// the north or south face is exposed: window bays run east-west along it
const exposedNS = (c) => [[0, 1], [0, -1]].some(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return !n || n.t !== c.t; });

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

// 1. foundation plinth (y0-1 under every cell, so downhill cells stand on stone), floor slabs per storey
for (const c of foot.values()) {
  put(c.x, 0, c.z, "stone_bricks"); put(c.x, 1, c.z, "stone_bricks");
  put(c.x, 5, c.z, "stone");
  if (c.t >= 10) put(c.x, 9, c.z, "stone");
  if (c.t === 14) put(c.x, 13, c.z, "stone");
}

// 2. perimeter walls: a stallboard (or sill) course, two rows of window or pier, a spandrel, and the cornice cap
for (const c of foot.values()) {
  if (!isPerim(c)) continue;
  const u = exposedNS(c) ? c.x : c.z;
  const win = u % 3 !== 0;                       // two-wide window bays between one-wide piers
  for (const b of [2, 6, 10]) {
    if (c.t < b + 4) continue;                   // the storey exists on this tier
    put(c.x, b, c.z, b === 2 ? "polished_andesite" : "smooth_quartz");
    for (const y of [b + 1, b + 2]) put(c.x, y, c.z, win ? "glass_pane" : "smooth_quartz");
    put(c.x, b + 3, c.z, "smooth_quartz");      // spandrel line, or the cornice on the top storey
  }
  put(c.x, c.t, c.z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet cap
}

// 3. north-wing doorway with a lintel band: a door in the first bay of the lowest wing, facing the street
const door = cellAt(6, 0);
if (!door || !isPerim(door)) throw new Error("no doorway cell at 6,0");
put(6, 2, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(6, 3, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 5; x <= 7; x++) put(x, 4, 0, "smooth_quartz");

// 4. roof plant: a 2x2 penthouse on the core roof (two cells of louvred glass on its north face), a stone cap at y16
const sq = [];
for (const c of foot.values()) {
  if (c.t !== 14) continue;
  const quad = [cellAt(c.x + 1, c.z), cellAt(c.x, c.z + 1), cellAt(c.x + 1, c.z + 1)];
  if (quad.every((n) => n && n.t === 14)) sq.push({ x0: c.x, z0: c.z });
}
sq.sort((a, b) => Math.abs(a.x0 - 12) + Math.abs(a.z0 - 14) - (Math.abs(b.x0 - 12) + Math.abs(b.z0 - 14)));
if (sq.length) {
  const { x0, z0 } = sq[0];
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const x = x0 + dx, z = z0 + dz;
    for (const y of [14, 15]) put(x, y, z, dz === 0 ? "glass_pane" : "smooth_quartz");
    put(x, 16, z, "smooth_stone");
  }
}

// 5. warm light behind some windows: a glowstone in the room just inside a lit bay's glass
for (const c of foot.values()) {
  if (!isPerim(c)) continue;
  for (const b of [2, 6, 10]) {
    const y = b + 1;
    if (c.t < b + 4 || (c.x * 5 + c.z * 3 + y) % 4 !== 0) continue;
    if (at(c.x, y, c.z)?.block !== "glass_pane") continue;
    for (const [dx, dz] of NB) {
      const n = cellAt(c.x + dx, c.z + dz);
      if (n && !isPerim(n) && !at(n.x, y, n.z)) { put(n.x, y, n.z, "glowstone"); break; }
    }
  }
}

// 6. glass panes connect to their wall neighbours (vanilla's pane states)
const WALL = new Set(["glass_pane", "smooth_quartz", "polished_andesite", "stone_bricks"]);
for (const [k, b] of blocks) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const on = (dx, dz) => { const n = at(x + dx, y, z + dz); return n && WALL.has(n.block) ? "true" : "false"; };
  b.state = { north: on(0, -1), south: on(0, 1), east: on(1, 0), west: on(-1, 0), waterlogged: "false" };
}

// 7. write the volume
const g = new Voxels([W, H, D]);
for (const [k, b] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const stats = g.save(OUT);
console.log(`cells ${cells.length}, tiers ${[...foot.values()].reduce((o, c) => ((o[c.t] = (o[c.t] || 0) + 1), o), {})}, saved ${OUT}`, stats);
