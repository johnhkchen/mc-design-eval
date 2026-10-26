// FR245159796: the Palais de Justice de Paris on the Ile de la Cite, a commercial-free civic block of limestone (calcite)
// walls on a stone plinth, sandstone string courses at every storey, and slate (deepslate tiles) roofs with a stone
// parapet. Storeys are 5 blocks, so the lidar's 24-40 block tops become 5-7 storeys. Each cell's top is the lidar
// roof smoothed over a 7x7 box and snapped to a 5-block storey line; the lidar's low wings (under 10) stay two storeys.
// Walls are built only on faces that look out (off the footprint, or above a neighbour's top), so the taller parts show
// their flanks and the shorter parts keep their own. Interior is air with one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245159796.cells.json", "utf8"));

const BODY = "calcite";              // Paris limestone, cream
const BAND = "smooth_sandstone";     // string courses and cornice
const SILL = "smooth_sandstone_slab"; // window sills
const BASE = "stone_bricks";         // plinth, base course, parapet
const FLOOR = "smooth_stone";        // storey slabs inside
const ROOF = "deepslate_tiles";      // slate roof cap
const GLASS = "glass";
const BRICK = "bricks";              // chimney stacks

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const cell = (x, z) => byXZ.get(`${x},${z}`);

// lidar roof -> smoothed (7 x 7 box) -> one of the storey lines 10..50
const RAD = 3;
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let s = 0, n = 0;
  for (let dx = -RAD; dx <= RAD; dx++) for (let dz = -RAD; dz <= RAD; dz++) {
    const c = cell(x + dx, z + dz); if (c) { s += c.r; n++; }
  }
  top.set(`${x},${z}`, Math.min(50, Math.max(10, 5 * Math.round(s / n / 5))));
}
const T = (x, z) => top.get(`${x},${z}`);

const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of (x, z) at height y that look out: off the footprint, or above a lower neighbour's top
const faces = (x, z, y) => OUT.filter(([dx, dz]) => !cell(x + dx, z + dz) || y >= T(x + dx, z + dz));
const exposed = (x, z, y) => faces(x, z, y).length > 0;

const g = new Voxels([46, 67, 308]);

// the entrances: the north block's west door on its north face and the south block's on its south face
const doorAt = (x, z) => (x === 29 && z === 0) || (x === 12 && z === 307);

for (const [x, z, gr] of cells) {
  const Ttop = T(x, z);
  // foundation: solid from y 0 up to the ground, so nothing floats on a slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  for (let y = gr; y < Ttop; y++) {
    const out = exposed(x, z, y);
    const fs = faces(x, z, y);
    // along the face this wall looks out of: x for a north/south face, z for an east/west one
    const along = fs.some(([dx, dz]) => dz !== 0) ? x : z;
    const pier = along % 3 === 0;   // a calcite pier between each three-wide bay

    if (y === Ttop - 1) { g.set(x, y, z, out ? BASE : ROOF); continue; }            // parapet on the edge, slate cap inside
    if (y === Ttop - 2) { g.set(x, y, z, out ? BAND : FLOOR); continue; }          // cornice on the wall, ceiling slab inside
    if (!out) { if (y % 5 === 0 && y > 0) g.set(x, y, z, FLOOR); continue; }       // interior: storey slabs, air between
    if (y % 5 === 0 && y > 0) { g.set(x, y, z, BAND); continue; }                  // string course at each storey line

    // the door: a pair of doors on the ground floor, its lintel above
    const outward = fs.find(([, dz]) => dz !== 0)?.[1] ?? 0;
    if (doorAt(x, z) && y <= gr + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: outward > 0 ? "south" : "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doorAt(x, z) && y === gr + 2) { g.set(x, y, z, BODY); continue; }

    if (y === gr) { g.set(x, y, z, BASE); continue; }                              // base course over the plinth
    const row = y % 5;
    if (row === 1) { g.set(x, y, z, pier ? BODY : SILL, pier ? undefined : { type: "bottom", waterlogged: "false" }); continue; }
    if (row === 4 || pier) { g.set(x, y, z, BODY); continue; }                     // lintel row and piers
    g.set(x, y, z, GLASS);                                                          // window panes

    // a warm lamp on the floor inside, in some windows: the lantern stands on the storey slab
    if (row === 2 && along % 9 === 4) {
      const [dx, dz2] = fs[0];
      const [ix, iz] = [x - dx, z - dz2];
      if (cell(ix, iz) && !exposed(ix, iz, y - 1)) g.set(ix, y - 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // a few chimney stacks on the slate, standing on the roof cap
  if (Ttop >= 25 && !exposed(x, z, Ttop - 1) && (x * 7 + z * 11) % 37 === 0) {
    for (let y = Ttop; y < Ttop + 3; y++) g.set(x, y, z, BRICK);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245159796.nbt");
console.log("built", g.count(), "blocks");
