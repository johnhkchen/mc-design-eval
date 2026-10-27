// Whitcombe and Tombs Building, Auckland (way 292861487): a 1920s stripped-classical commercial block, reinforced
// concrete in cream plaster, eight storeys to the lidar roof (33 blocks above y 0), a shopfront ground floor on a
// dark plinth, pilastered window bays, a coping and a plant room on the roof. Walls are the footprint's perimeter cells
// only; the interior is air with a floor slab per storey, and the lidar roof heights are smoothed into three tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861487.cells.json`, "utf8"));   // [x, z, ground, roof]

const FOUNDATION = "polished_andesite", PLINTH = "polished_andesite", WALL = "smooth_quartz", COPING = "smooth_quartz_slab";
const FLOOR = "smooth_stone", ROOF = "stone_bricks", GLASS = "light_blue_stained_glass", PLANT = "copper_block";

const W = 66, D = 34, H = 46;
const g = new Voxels([W, H, D]);

// the footprint, keyed by x,z
const cols = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const inF = (x, z) => cols.has(`${x},${z}`);
// lidar roof heights smoothed into three flat tiers: the core at 33 (8 storeys), a wing at 28, the low edges at 24
const tier = (roof) => (roof >= 31 ? 33 : roof >= 27 ? 28 : 24);
// perimeter cells: at least one side open to the outside
const sidesOpen = (x, z) => [!inF(x - 1, z), !inF(x + 1, z), !inF(x, z - 1), !inF(x, z + 1)].filter(Boolean).length;
const shell = (x, z) => sidesOpen(x, z) > 0;
// the entrance: the front (lowest z) perimeter cell nearest the middle of that row
const frontRow = [...cols.values()].filter((c) => shell(c.x, c.z) && c.z === Math.min(...[...cols.values()].filter((d) => shell(d.x, d.z)).map((d) => d.z)));
const entrance = frontRow.sort((a, b) => a.x - b.x)[Math.floor(frontRow.length / 2)];

for (const c of cols.values()) {
  const { x, z } = c, gr = c.ground, R = tier(c.roof), edge = shell(x, z);
  // foundation: solid from y 0 to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  // storeys stand on the ground: floors at gr + 4k, the roof slab at gr + 4n, a parapet up to R
  const n = Math.floor((R - gr - 1) / 4), roofY = gr + 4 * n;
  const floorAt = (y) => (y - gr) % 4 === 0 && y >= gr && y < roofY;
  // interior: a floor slab per storey and the roof slab, air between them
  if (!edge) {
    for (let k = 0; k <= n; k++) g.set(x, gr + 4 * k, z, k < n ? FLOOR : ROOF);
  }
  if (!edge) {
    // roof equipment on the core: two plant rooms of one-block copper housing on the roof slab, in clusters
    const core = [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => inF(x + dx, z + dz)));
    if (core && R === 33 && (Math.floor(x / 8) + Math.floor(z / 8)) % 3 === 1 && (x + z) % 2 === 0) g.set(x, roofY + 1, z, PLANT);
    continue;
  }
  // the shell: a plinth course, pilastered bays of glass, a string course at each floor, a coping on top
  const corner = sidesOpen(x, z) >= 2;
  const pier = corner || (x + z) % 3 === 0;
  for (let y = gr; y < R; y++) {
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }
    if (y === R - 1) { g.set(x, y, z, COPING, { type: "top", waterlogged: "false" }); continue; }
    if (y > roofY) { g.set(x, y, z, WALL); continue; }           // parapet
    if (y === roofY) { g.set(x, y, z, COPING, { type: "top", waterlogged: "false" }); continue; }
    if (floorAt(y)) { g.set(x, y, z, COPING, { type: "bottom", waterlogged: "false" }); continue; }   // storey string course
    const storeyBase = gr + 4 * Math.floor((y - gr) / 4);
    if (y === storeyBase + 1 || y === storeyBase + 2 || y === storeyBase + 3) {
      g.set(x, y, z, pier ? WALL : GLASS);
    }
  }
  // the entrance: a dark-oak door in the front wall, a plinth and lintel round it
  if (entrance && x === entrance.x && z === entrance.z) {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, PLINTH);
  }
}

// warm light behind some windows: a lantern on the interior floor, inside the glass
let lamps = 0;
for (const c of cols.values()) {
  if (!shell(c.x, c.z)) continue;
  const gr = c.ground, R = tier(c.roof), n = Math.floor((R - gr - 1) / 4);
  for (let k = 0; k < n; k++) {
    const f = gr + 4 * k, y = f + 1;
    if (y >= R || (c.x * 7 + c.z * 3 + k * 5) % 11 !== 0) continue;
    if ((c.x + c.z) % 3 === 0) continue;          // a pier, not a window
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx, nz = c.z + dz;
      const inner = cols.get(`${nx},${nz}`);
      if (!inner || shell(nx, nz) || inner.ground !== gr) continue;
      g.set(nx, y, nz, "lantern", { hanging: "false", waterlogged: "false" });
      lamps++;
      break;
    }
  }
}

const out = `${DIR}/way_292861487.nbt`;
const r = g.save(out);
console.log(`way_292861487: ${cols.size} footprint cells, ${r.blocks} blocks, ${r.palette} palette entries, ${lamps} lamps -> ${out}`);
