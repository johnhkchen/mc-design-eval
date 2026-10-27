// Mt Eden shopfront block (footprint way 269465559): a one-storey plastered commercial building of the 1920s on a fall
// from the west (ground 2) down to the east (ground 0). The lidar roof sits at 4 blocks above y 0 across the footprint,
// so the massing is one storey with a coping to 5; two corners at ground level read as a terrace. Built as a solid
// foundation to each cell's ground, a base course, plaster walls with framed glass bays, a dark cornice, and a flat roof
// with rooftop plant. The downhill east face is the shopfront, with the entrance and a hanging lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465559.cells.json", "utf8"));
const SAVE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465559.nbt";

// Placements go to a map first, so a pane's connections can be read from its neighbours before the volume is written.
const at = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => at.set(key(x, y, z), { block, state });
const has = (x, y, z) => at.has(key(x, y, z));

// Each footprint cell: g = lidar ground (fill from 0 to g), r = lidar roof top above y 0.
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
// A cell whose roof is no higher than its ground is a terrace slab at ground level, not a building cell.
const bld = new Set(), ter = new Set();
for (const [k, c] of fp) (c.r > c.g ? bld : ter).add(k);
const inB = (x, z) => bld.has(`${x},${z}`);
const perim = (x, z) => !inB(x + 1, z) || !inB(x - 1, z) || !inB(x, z + 1) || !inB(x, z - 1);

// Every cell stands on its own foundation to its ground; nothing hangs.
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone");
  if (ter.has(k)) put(x, c.g, z, "smooth_stone");
}

// Building columns, bottom up: base course, wall bays, cornice at the roof, and a coping course above the roof.
// Interior cells keep a floor slab at ground and a roof slab, with air between: no rooms, but an air gap behind glass.
const eastFront = (x, z) => !inB(x + 1, z) && fp.get(`${x},${z}`).g === 0;
// The entrance: the middle downhill east-face cell, so it stands on the lowest ground.
const eastCells = [...bld].map((k) => k.split(",").map(Number)).filter(([x, z]) => eastFront(x, z)).sort((a, b) => a[1] - b[1]);
const door = eastCells[Math.floor(eastCells.length / 2)];

for (const k of bld) {
  const [x, z] = k.split(",").map(Number);
  const { g: G, r: R } = fp.get(k);
  const outer = perim(x, z);
  // The facade a perimeter cell is on, and its position along that facade (for the bay grid).
  const east = !inB(x + 1, z), west = !inB(x - 1, z);
  const along = east || west ? z : x;
  for (let y = G; y <= R; y++) {
    if (!outer) {
      if (y === G) put(x, y, z, "smooth_stone");                  // floor slab
      else if (y === R - 1) put(x, y, z, "smooth_stone");        // roof slab
      continue;                                                   // air between
    }
    if (y === G) put(x, y, z, "stone_bricks");                    // base course
    else if (y === R - 1) put(x, y, z, "stone_bricks");           // dark cornice band
    else if (y === R) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // coping
    else if (y > G && y < R - 1) {
      const windowRow = y >= G + 1 && y <= R - 2;
      if (!windowRow) put(x, y, z, "smooth_quartz");
      else if (along % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });   // window mullion
      else if (east && y === G + 1) put(x, y, z, "glass");       // shopfront plate glass
      else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    }
  }
}

// The entrance: a dark oak door set in the east face, with a dark lintel over it.
{
  const [x, z] = door;
  put(x, 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dz of [-1, 0, 1]) if (inB(x, z + dz)) put(x, 3, z + dz, "dark_oak_planks");
  // a hanging lantern just inside the door, under the roof slab
  if (inB(x - 1, z)) put(x - 1, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light in some bays: a glowstone behind a pane on the top window row, inside the air gap.
for (const k of bld) {
  const [x, z] = k.split(",").map(Number);
  const { g: G, r: R } = fp.get(k);
  if (!perim(x, z) || !(!inB(x + 1, z) || !inB(x - 1, z))) continue;
  const east = !inB(x + 1, z);
  const along = z;
  if (along % 6 !== 1) continue;
  const y = R - 2;
  if (y < G + 1) continue;
  const bx = east ? x - 1 : x + 1;
  if (inB(bx, z) && !has(bx, y, z)) put(bx, y, z, "glowstone");
}

// Rooftop plant: two 2x2 iron units on the roof, on interior cells well inside the coping.
let units = 0;
for (const k of bld) {
  if (units >= 2) break;
  const [x, z] = k.split(",").map(Number);
  const { r: R } = fp.get(k);
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = block.every(([a, b]) => inB(a, b) && !perim(a, b) && fp.get(`${a},${b}`).r === R);
  if (!ok || x < 5 || z < 3) continue;
  if (units === 1 && Math.abs(x - 8) < 3) continue;
  for (const [a, b] of block) put(a, R, b, "iron_block");
  units++;
}

// Glass panes connect to the solid things they touch, so a run of panes reads as one frame.
for (const [k, v] of at) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  v.state = { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
}

// Write the volume.
const g = new Voxels([19, 17, 13]);
for (const [k, v] of at) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save(SAVE);
console.log(`way_269465559: ${stats.blocks} blocks, ${stats.palette} palette entries, door at x${door[0]} z${door[1]}, ${units} rooftop units`);
