// A three-storey 1930s brick commercial block on the Mt Eden edge: basalt-stone plinth, shopfront at street level on the
// low (north) side with a central door under a timber canopy band, brick piers between framed windows above, white
// string courses and a cornice, a stone parapet, and a low single-storey wing on the west side. Walls are one block
// thick with an air gap behind the glass; each storey has a solid floor slab over the footprint, and the roof is a deck.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170814.cells.json", "utf8"));
const OUT_FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170814.nbt";

// [x, z] -> { g: ground, r: roof top (exclusive) }
const FP = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const cell = (x, z) => FP.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                 // outward: east, west, south, north
const SLABS = [4, 8];                                             // floor slabs of storeys 2 and 3 (storey 1 sits on the ground slab)
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // in a north/south wall
const PANE_EW = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }; // in an east/west wall
const ENTRANCE = [4, 1];                                          // on the north (low, street) face, under the canopy

// the outward directions along which cell x, z has no solid neighbour at height y
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || y >= n.r; });

// lanterns hang from the slab above, in the air gap behind the top light of some upper-storey windows
const LANTERNS = new Set();
for (const [x, z, , r] of cells) for (const k of [1, 2]) {
  const y = 4 * k + 3;                                            // the top glass row of storey k
  if (y >= r - 1) continue;
  const out = exposed(x, y, z);
  if (out.length !== 1) continue;                                 // a plain wall cell, not a corner
  const [dx, dz] = out[0], along = dz !== 0 ? x : z;
  if (along % 3 === 0 || (along + k) % 2 !== 0) continue;         // windows sit between piers; every other one lights up
  const ix = x - dx, iz = z - dz, inner = cell(ix, iz);
  if (!inner || exposed(ix, y, iz).length || y + 1 >= inner.r) continue;
  if (SLABS.includes(y + 1) || y + 1 === inner.r - 1) LANTERNS.add(`${ix},${iz},${y}`);
}

// what stands in cell x, y, z: [block, state] or null (air)
function part(x, z, y) {
  const c = cell(x, z); if (!c) return null;
  const { g, r } = c; if (y >= r) return null;
  if (y < g) return ["stone_bricks"];                             // foundation under the lower cells of the slope
  const out = exposed(x, y, z), ext = out.length > 0;
  if (y === r - 1) return [ext ? "stone_bricks" : "smooth_stone"];  // parapet on the edge, roof deck inside
  if (y === g) return [ext ? "stone_bricks" : "smooth_stone"];      // base course on the street, ground slab inside
  if (SLABS.includes(y)) return [ext ? "white_concrete" : "smooth_stone"];   // string course outside, floor slab inside
  if (!ext) return LANTERNS.has(`${x},${z},${y}`) ? ["lantern", { hanging: "true", waterlogged: "false" }] : null;
  if (y === r - 2) return ["white_concrete"];                     // cornice under the parapet

  const k = y >= 8 ? 2 : y >= 4 ? 1 : 0, j = y - (k === 0 ? g : 4 * k) - 1;   // storey, and row within it (0 sill, 1, 2)
  const faceNS = out.some(([, dz]) => dz !== 0), faceEW = out.some(([dx]) => dx !== 0);
  const pier = (faceNS && faceEW) || (faceNS ? x : z) % 3 === 0;  // corners and every third bay are piers; two-bay windows between
  const pane = faceNS ? PANE_NS : PANE_EW;

  if (k === 0) {
    if (x === ENTRANCE[0] && z === ENTRANCE[1] && j <= 1) {
      const half = j === 0 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
    if (pier) return ["dark_oak_log", { axis: "y" }];
    if (j === 0) return ["polished_andesite"];                    // stall riser
    if (j === 1) return ["glass_pane", pane];                     // shop glass
    return ["dark_oak_planks"];                                   // timber canopy band
  }
  if (pier) return ["bricks"];
  if (j === 0) return ["white_concrete"];                         // sill
  return ["glass_pane", pane];
}

const g = new Voxels([8, 26, 9]);
for (let z = 0; z < 9; z++) for (let x = 0; x < 8; x++) {
  const c = cell(x, z); if (!c) continue;
  for (let y = 0; y < c.r; y++) { const p = part(x, z, y); if (p) g.set(x, y, z, p[0], p[1]); }
}
// roof plant: a light-grey box on the deck, over the centre of the main block
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) for (const y of [13, 14]) g.set(x, y, z, "light_gray_concrete");

const { blocks, palette } = g.save(OUT_FILE);
console.log(`way_912170814: ${blocks} blocks, ${palette} palette entries`);
