// Mt Eden / Newton street building, footprint 8 x 9 blocks, 2 storeys on the east wing and a 3-storey corner on the west.
// Read as an Interwar brick shop-top (1920s-30s): red brick walls on a black Auckland-basalt plinth, cream render for
// the floor lines, head bands and cornice, timber fascia over a street-front shopfront, glazed bays between brick piers,
// a flat roof with a plant box. Storey rhythm is fixed by y: y%4==0 floor line, 1..2 glazing, 3 fascia/head band.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354706.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354706.nbt";

// Per footprint cell: ground (third number) and the top block's y. Lidar roofs are 8 and 11 with a 9 on a two-cell patch
// at the south-west edge; that bump is smoothed into the 8 tier so the lower wing reads as one flat roof.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, top: (roof === 9 ? 8 : roof) - 1 });

const at = (x, z) => cell.get(`${x},${z}`);
const topOf = (x, z) => at(x, z)?.top ?? -1;

// The outward face of a voxel: the first side whose neighbour is off the footprint or lower than the voxel (north = -z).
const SIDES = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];
function outward(x, y, z) {
  for (const s of SIDES) if (topOf(x + s.dx, z + s.dz) < y) return s;
  return null;
}
const interior = (x, y, z) => at(x, z) && y <= topOf(x, z) && !outward(x, y, z);

const paneState = (o) => (o.dz
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const stairsState = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };

// What a voxel is: [block, state] or null (air). Walls are solid from the plinth to the top, floors every 4 blocks inside.
function spec(x, y, z) {
  const c = at(x, z);
  if (!c || y > c.top) return null;
  if (y < c.ground) return ["polished_blackstone_bricks"];           // foundation under a sloping cell (none: ground is 0)
  const o = outward(x, y, z);
  if (!o) {                                                          // no interiors: a floor slab per storey, a roof on top
    if (y === c.top) return ["gray_concrete"];
    return y % 4 === 0 ? ["smooth_stone"] : null;
  }
  if (y === c.top) return ["smooth_quartz"];                         // cornice / parapet
  if (y === 0) return ["polished_blackstone_bricks"];                // basalt base course
  if (o.dz === -1 && y <= 3) {                                       // street front: shopfront, door, canopy
    if (x === 4 && y === 1) return ["dark_oak_door", doorState("lower")];
    if (x === 4 && y === 2) return ["dark_oak_door", doorState("upper")];
    if (x >= 3 && x <= 5 && y === 3) return ["dark_oak_stairs", stairsState];
    if (x >= 3 && x <= 5) return ["glass"];
  }
  if (y % 4 === 0) return ["smooth_quartz"];                         // floor line / string course
  if (y % 4 === 3) return [y === 3 ? "dark_oak_planks" : "smooth_quartz"];   // ground fascia / upper head band
  const u = o.dx ? z : x;                                            // along the face: brick piers, glazed bays
  if (u % 3 === 0) return ["bricks"];
  return ["glass_pane", paneState(o)];
}

const g = new Voxels([8, 24, 9]);
const put = (x, y, z, s) => { if (s) g.set(x, y, z, s[0], s[1]); };
for (let z = 0; z < 9; z++) for (let x = 0; x < 8; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 0; y <= c.top; y++) put(x, y, z, spec(x, y, z));
}

// Warm light behind some glazing: glowstone or shroomlight on the room side of a window, and the two shop lights.
for (const x of [3, 5]) g.set(x, 1, 1, "glowstone");
for (let z = 0; z < 9; z++) for (let x = 0; x < 8; x++) {
  const c = at(x, z); if (!c) continue;
  for (let y = 1; y < c.top; y++) {
    const s = spec(x, y, z); if (!s || s[0] !== "glass_pane") continue;
    if ((x + 2 * z + y) % 9 !== 1) continue;
    const o = outward(x, y, z); if (!o) continue;
    const ix = x - o.dx, iz = z - o.dz;
    if (!interior(ix, y, iz) || spec(ix, y, iz)) continue;
    g.set(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// Roof plant: a 2 x 2 box with a cream cap on the lower roof, clear of the parapet.
for (const x of [5, 6]) for (const z of [6, 7]) {
  g.set(x, 8, z, "light_gray_concrete"); g.set(x, 9, z, "light_gray_concrete");
  g.set(x, 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
