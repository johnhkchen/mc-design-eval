// The Galleries: a five-storey commercial block on a 72 x 30 footprint. The lidar roof sets two flat tiers (a main block
// at 22 blocks and a lower east wing at 18); each cell stands on its own ground (foundation to y = ground), so the
// downhill side shows its extra storeys. Facades are a 3-block bay rhythm of glass panes and concrete piers over
// spandrels, a glazed shopfront with a dark fascia on the ground storey, three doors, and warm lights behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660673.cells.json", "utf8"));
const W = 72, D = 30, H = 35;
const M = {
  found: "stone_bricks", slab: "smooth_stone", base: "polished_andesite", pier: "light_gray_concrete",
  spandrel: "white_concrete", shop: "light_blue_stained_glass", pane: "light_blue_stained_glass_pane",
  fascia: "gray_concrete", cornice: "stone_bricks", parapet: "white_concrete", roof: "smooth_stone",
  lamp: "glowstone", plant: "light_gray_concrete", door: "dark_oak_door",
};
const DOOR_X = [14, 40, 62];                       // north-face entrances (wall cells on the north side only)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// cell ledger: [x, z, ground, roof] -> { g, r, T }
const cell = new Map();
const k2 = (x, z) => z * W + x;
for (const [x, z, g, r] of cells) cell.set(k2(x, z), { x, z, g, r, T: null, face: null });
const has = (x, z) => cell.has(k2(x, z));

// tiers: roof >= 21 is the main block (22), 17..20 the east wing (18); the few cells below 17 are lidar fringe noise,
// taken from the majority tier of their neighbours
const tierOf = (r) => (r >= 21 ? 22 : 18);
for (const c of cell.values()) if (c.r >= 17) c.T = tierOf(c.r);
let smoothed = 0;
for (const c of cell.values()) {
  if (c.T !== null) continue;
  const votes = {};
  for (const [dx, dz] of Object.values(DIRS)) { const n = cell.get(k2(c.x + dx, c.z + dz)); if (n && n.T !== null) votes[n.T] = (votes[n.T] || 0) + 1; }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  c.T = best ? Number(best[0]) : 18; smoothed++;
}

// facade: an outside neighbour makes a wall (first), else a lower neighbour makes a setback wall
for (const c of cell.values()) {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (!has(c.x + dx, c.z + dz)) { c.face = d; break; } }
  if (!c.face) for (const d of ["N", "S", "W", "E"]) {
    const [dx, dz] = DIRS[d]; const n = cell.get(k2(c.x + dx, c.z + dz));
    if (n && n.T < c.T) { c.face = d; break; }
  }
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const isWall = (x, z) => { const n = cell.get(k2(x, z)); return !!(n && n.face); };
const alongOf = (c) => (c.face === "N" || c.face === "S" ? c.x : c.z);
const connects = (dx, dz) => isWall(dx, dz);
let doors = 0, lamps = 0, panes = 0;

for (const c of cell.values()) {
  const { x, z, g: gr, T, face } = c;
  const R = T - 2;                                  // the roof slab row; the parapet sits above it on walls
  for (let y = 0; y < gr; y++) set(x, y, z, M.found);
  for (let F = gr, k = 0; F <= R - 2; F += 4, k++) {
    const ground = k === 0;
    set(x, F, z, face && ground ? M.base : M.slab);  // this storey's floor slab
    if (!face) continue;
    const spandrelRow = Math.min(F + 3, R - 1);      // a storey's head band; the top storey's band sits under the cap
    const a = alongOf(c);
    const pier = a % 3 === 0;
    for (let y = F + 1; y < spandrelRow; y++) {
      if (pier) { set(x, y, z, M.pier); continue; }
      if (ground) { set(x, y, z, M.shop); continue; }
      // panes join their neighbours along the facade only
      const along = face === "N" || face === "S"
        ? { east: connects(x + 1, z), west: connects(x - 1, z), north: false, south: false }
        : { north: connects(x, z - 1), south: connects(x, z + 1), east: false, west: false };
      const st = Object.fromEntries(Object.entries(along).map(([k, v]) => [k, String(v)]));
      set(x, y, z, M.pane, st); panes++;
    }
    set(x, spandrelRow, z, ground ? M.fascia : M.spandrel);
    // warm light: one pane in three bays on the upper storeys, a lamp on the floor just inside the glass
    if (!ground && a % 9 === 4 && spandrelRow > F + 1) {
      const [ix, iz] = INWARD[face];
      const n = cell.get(k2(x + ix, z + iz));
      if (n && !n.face && (F - n.g) % 4 === 0 && F - n.g >= 0) { set(x + ix, F + 1, z + iz, M.lamp); lamps++; }
    }
  }
  if (face) {
    set(x, R, z, M.cornice);
    set(x, T - 1, z, M.parapet);
    // the door: north-face entrances in the shopfront bay
    if (face === "N" && gr <= 7 && DOOR_X.includes(x) && R - 2 >= gr + 2) {
      const f = gr;
      const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
      set(x, f + 1, z, M.door, st("lower")); set(x, f + 2, z, M.door, st("upper")); doors++;
    }
  } else {
    set(x, R, z, M.roof);
  }
}

// two plant rooms on the main roof, standing on the roof slab
let plants = 0;
for (const [x0, x1, z0, z1] of [[28, 33, 12, 14], [47, 52, 17, 19]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const n = cell.get(k2(x, z));
    if (!n || n.face || n.T !== 22) continue;
    for (let y = n.T - 2 + 1; y <= n.T; y++) set(x, y, z, M.plant);
    plants++;
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660673.nbt";
const info = g.save(out);
console.log(`cells ${cell.size}, low-roof cells smoothed ${smoothed}, panes ${panes}, doors ${doors}, lamps ${lamps}, plant cells ${plants}`);
console.log(`wrote ${out}: ${info.blocks} blocks, palette ${info.palette}`);
