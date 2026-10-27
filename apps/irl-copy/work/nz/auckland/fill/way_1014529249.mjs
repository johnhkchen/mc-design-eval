// Auckland City Mission Opshop (way 1014529249): a two-storey 1930s brick-and-plaster shop block with a parapet,
// and a third storey on the rise to the west where the lidar roof reads 11. Walls rise from y 0 on every side, so the
// downhill side shows its full storeys and the uphill foundation is buried. Interior is air with floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1014529249.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([16, 24, 17]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => at.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isPerim = (x, z) => exposed(x, z).length > 0;

// Massing: 3x3 mean of the lidar roof, then two flat tiers. Roof 9 = two storeys of 4 under a cap; 11 = a third storey.
// A lone high cell is lidar noise, not a tower: it takes the third storey only with at least four high neighbours.
const tierOf = (x, z) => {
  let s = 0, n = 0, high = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = at.get(`${x + dx},${z + dz}`); if (c) { s += c.roof; n++; if (c.roof >= 10) high++; }
  }
  return s / n >= 10 && high >= 4 ? 11 : 9;
};

// Front: the south (+z) face, shopfront on the ground storey with the door at (10, 15).
const SHOP = new Set(["8,15", "9,15", "10,15", "11,15", "12,16", "13,16"]);
const DOOR = [10, 15];

const wallMat = (s) => (s === 0 ? "bricks" : "smooth_quartz");   // brick ground storey, plaster above
const paneState = (dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }    // wall runs along x
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });  // wall runs along z

const glass = [];   // windows and shop glass, to light from inside

for (const [x, z, ground] of cells) {
  const t = tierOf(x, z), cap = t - 1;
  const ex = exposed(x, z), perim = ex.length > 0;
  const [dx, dz] = ex[0] ?? [0, 0];
  const shop = SHOP.has(`${x},${z}`);
  for (let y = 0; y <= cap; y++) {
    const s = Math.floor(y / 4), r = y % 4;
    if (y === cap) { g.set(x, y, z, "smooth_stone"); continue; }                  // roof slab over every cell
    if (y < ground || r === 0) { g.set(x, y, z, "stone_bricks"); continue; }     // foundation and floor slabs
    if (!perim) continue;                                                       // interior: air behind the glass
    if (shop && s === 0) {
      if (r === 3) g.set(x, y, z, "dark_oak_planks", {});                       // shopfront fascia
      else if (x === DOOR[0] && z === DOOR[1]) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "glass_pane", paneState(dz)); glass.push({ x, y, z, dx, dz, s });
      }
      continue;
    }
    if (r === 3) { g.set(x, y, z, "stone_bricks"); continue; }                  // storey belt course
    const along = dz !== 0 ? x : z, end = dz !== 0 ? 14 : 15;
    if (along % 3 === 1 && along >= 1 && along <= end) {                        // window bay between piers
      g.set(x, y, z, "glass_pane", paneState(dz)); glass.push({ x, y, z, dx, dz, s });
    } else {
      g.set(x, y, z, wallMat(s));
    }
  }
  // parapet on the perimeter, a low slab on the roof slab
  if (perim) g.set(x, t, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// warm light behind every other pane, in the interior cell just inside it
for (const { x, y, z, dx, dz, s } of glass) {
  if ((x + z + s) % 2 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  const ly = 4 * s + 1;
  if (ly === y) g.set(ix, ly, iz, "glowstone");
}

// every wall, pane and fitting must stand on something; floor and roof slabs span the hollow on their walls
let floating = 0;
for (const [x, z] of cells) {
  const top = tierOf(x, z) - 1;
  for (let y = 1; y <= top + 1; y++) {
    if (!g.get(x, y, z) || y % 4 === 0 || y === top) continue;
    if (!g.get(x, y - 1, z)) floating++;
  }
}
if (floating) console.warn(`floating cells: ${floating}`);

const out = g.save(`${DIR}/way_1014529249.nbt`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
