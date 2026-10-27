// Way 769193363, Auckland CBD edge: a 1960s-70s concrete-frame commercial block. Three tiers from the lidar roof
// heights (a single-storey shopfront wing, a 3-storey body, a 2-block lift tower on the body), a stone plinth
// stepping down with the ground, white spandrel bands, polished-andesite piers between blue-tinted glass panes,
// a recessed entrance with a lintel canopy, a shopfront ground floor, and warm lights set behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193363.cells.json", "utf8"));

// Lidar roofs are noisy (9, 10, 6 ...): snap each to a clean tier top. 3 = single-storey wing, 10 = body, 12 = tower.
const tierTop = (r) => (r >= 12 ? 12 : r <= 4 ? 3 : 10);
const col = new Map();                                         // "x,z" -> { g: ground, t: roof top (exclusive) }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, t: tierTop(r) });

const inM = (x, y, z) => { const c = col.get(`${x},${z}`); return !!c && y >= 0 && y < c.t; };
const interior = (x, y, z) => inM(x - 1, y, z) && inM(x + 1, y, z) && inM(x, y, z - 1) && inM(x, y, z + 1) && inM(x, y - 1, z) && inM(x, y + 1, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];               // E, W, S, N (in x, z)

const out = new Map();                                         // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => out.has(`${x},${y},${z}`);

// Materials: plinth and base course, white spandrel and head bands, andesite piers, blue glass, smooth stone parapet.
const PLINTH = "stone_bricks", BAND = "white_concrete", PIER = "polished_andesite", CAP = "smooth_stone", PANE = "light_blue_stained_glass_pane", FLOOR = "smooth_stone";

for (const [k, { g, t }] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const exposed = DIRS.filter(([dx, dz]) => !inM(x + dx, y, z + dz));
    const boundary = exposed.length > 0 || y === 0;
    if (y === t - 1) { put(x, y, z, CAP); continue; }             // parapet and roof deck, the same course everywhere
    if (!boundary) { if (y >= g && (y - g) % 4 === 0) put(x, y, z, FLOOR); continue; }   // interior: air except floor slabs
    if (y < g || y === g) { put(x, y, z, PLINTH); continue; }    // plinth down to the ground, base course at the ground floor
    const rel = (y - g) % 4;
    if (rel === 0 || rel === 3) { put(x, y, z, BAND); continue; } // storey line and head band
    if (exposed.length >= 2 || (x + z) % 3 === 0) put(x, y, z, PIER, null);   // corners and every third column: frames
    else put(x, y, z, PANE, { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
  }
}

// Recessed entrance on the north face at (2, 0): door in the lower two storey-zone blocks, lintel canopy above.
const ent = 2, entZ = 0, entG = col.get(`${ent},${entZ}`).g;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(ent, entG, entZ, "iron_door", doorState("lower"));
put(ent, entG + 1, entZ, "iron_door", doorState("upper"));
put(ent, entG + 2, entZ, CAP);

// Warm lights two blocks behind some glass, so the cell right behind each pane stays open air.
for (const [key, b] of [...out]) {
  if (b.block !== PANE) continue;
  const [x, y, z] = key.split(",").map(Number);
  const d = DIRS.find(([dx, dz]) => !inM(x + dx, y, z + dz));
  if (!d) continue;
  const [dx, dz] = d;
  const lx = x - 2 * dx, lz = z - 2 * dz;
  if (((x * 5 + y * 7 + z * 3) % 11) === 0 && interior(lx, y, lz)) put(lx, y, lz, "glowstone");
}

// Roof plant: two air units on the body roof, one on the wing, one on the tower.
for (const [x, z] of [[2, 3], [3, 3], [2, 4], [3, 4]]) put(x, 10, z, "iron_block");
put(18, 3, 8, "white_concrete"); put(19, 3, 8, "white_concrete");
put(6, 12, 6, "iron_block");

// Pane connections: a pane joins each horizontal neighbour that holds a block (glass, pier, band, plinth).
for (const [key, b] of out) {
  if (b.block !== PANE) continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  b.state = { east: link(1, 0), west: link(-1, 0), south: link(0, 1), north: link(0, -1), waterlogged: "false" };
}

const g = new Voxels([23, 26, 13]);
for (const [key, b] of out) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const result = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769193363.nbt");
console.log(`way_769193363: ${result.blocks} blocks, ${result.palette} palette entries`);
