// DC54934: a three-tier Federal-style office block on the Mall's north-east edge (the Smithsonian/Federal Triangle
// idiom): a limestone-look shell on a stone base, a 1-block quartz string course at each floor line, a cornice and
// parapet on each tier, a recessed double-width-less entrance in the south pavilion, and warm light behind some glass.
// Footprint = the lidar cells; roof heights are 6 (wing), 7 (body), 8 (pavilion), already clean tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC54934.cells.json`, "utf8"));   // [x, z, ground, roof]

const foot = new Map();                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);
const roofAt = (x, z) => foot.get(`${x},${z}`).roof;

const W = 9, D = 7, Y = 20;
const g = new Voxels([W, Y, D]);

// which sides of a cell face open air at height y: a missing neighbour, or a lower tier that has no block at y
function exposure(x, z, y) {
  const e = { x: false, z: false };
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || roofAt(nx, nz) <= y) { if (dx) e.x = true; else e.z = true; }
  }
  return e;
}

// the ground under the footprint: foundation from y 0 up to each cell's ground (all 0 here, kept for the rule)
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

// the building, cell by cell, from its ground up to its own roof (the cap is the top solid row)
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const e = exposure(x, z, y);
    const edge = e.x || e.z;
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                              // base course
    if (y === 3) { g.set(x, y, z, edge ? "quartz_bricks" : "smooth_quartz"); continue; }   // first floor line
    if (y === top - 2) { g.set(x, y, z, edge ? "quartz_bricks" : "smooth_quartz"); continue; } // cornice / ceiling
    if (y === top - 1) { g.set(x, y, z, edge ? "quartz_bricks" : "polished_deepslate"); continue; } // parapet / roof deck
    if (!edge) continue;                                                                   // interior air gap

    const isWindowRow = y === 1 || y === 2 || (y >= 4 && y <= top - 3);
    const corner = e.x && e.z;
    if (corner || !isWindowRow) { g.set(x, y, z, corner ? "quartz_pillar" : "smooth_quartz", corner ? { axis: "y" } : undefined); continue; }

    // the south pavilion's entrance: a dark oak double-height door, centred on the front
    if (x === 5 && z === 6 && (y === 1 || y === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // a window bay alternates along each facade; the pane connects to its neighbours in the wall's plane
    const bay = e.z ? x % 2 === 1 : z % 2 === 1;
    if (!bay) { g.set(x, y, z, "smooth_quartz"); continue; }
    const state = e.z
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);

    // warm light in the air gap behind some panes: glowstone low, shroomlight on the upper storey
    const lx = x + (e.x ? (x === 0 ? 1 : -1) : 0), lz = z + (e.z ? (z === 0 ? 1 : -1) : 0);
    if (!inF(lx, lz) || roofAt(lx, lz) - 2 <= y) continue;                  // not an air gap behind the pane
    const le = exposure(lx, lz, y);
    if (le.x || le.z) continue;
    if (y === 1 && (x + z) % 3 === 0) g.set(lx, y, lz, "glowstone");
    if (y === 4 && (x + z) % 4 === 1) g.set(lx, y, lz, "shroomlight");
  }
}

// the pavilion's door hall: one warm light behind the entrance
g.set(5, 1, 5, "glowstone");

// roof equipment on the body's roof (boxes on the roof deck, the air above them is clear)
for (const [x, z] of [[2, 3], [3, 3], [6, 3], [6, 4]]) g.set(x, 7, z, "smooth_stone");

const out = `${DIR}/DC54934.nbt`;
const r = g.save(out);
console.log(`DC54934: ${r.blocks} blocks, ${r.palette} palette entries -> ${out}`);
