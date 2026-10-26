// 1646 3rd St NW: a brick church hall with stone trim, a flat slate deck inside a parapet, and a glazed front.
// Massing comes from the footprint and the lidar roof: the perimeter ring rises to the parapet (the lidar's 5), the
// interior deck sits one course lower (the lidar's 4). Medians smooth the per-cell lidar noise into two tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62923.cells.json`, "utf8"));   // [x, z, ground, roof]

const k = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const inS = (x, z) => roof.has(k(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// the faces of a footprint cell that look out of the footprint (N = z-1 front, S = z+1 back, W = x-1, E = x+1)
const faces = (x, z) => [["N", x, z - 1], ["S", x, z + 1], ["W", x - 1, z], ["E", x + 1, z]]
  .filter(([, a, b]) => !inS(a, b)).map(([d]) => d);
const edge = (x, z) => faces(x, z).length > 0;

const WALL_TOP = median(cells.filter(([x, z]) => edge(x, z)).map((c) => c[3]));    // parapet, solid up to y < 5
const DECK_TOP = median(cells.filter(([x, z]) => !edge(x, z)).map((c) => c[3]));   // slate deck, solid up to y < 4

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

// one wall cell's block at height y: base course, storey band, parapet, and the glazed storey between them
function wall(x, z, y) {
  if (y === 0 || y === 3) return ["stone_bricks"];           // base course and the band under the parapet
  if (y === 4) return ["bricks"];                            // parapet
  const f = faces(x, z);
  if (f.length > 1) return ["stone_bricks"];                 // quoins at the corners
  const d = f[0];
  if (d === "N") {                                           // front: p = x
    if (x === 3 || x === 4) return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 3 ? "left" : "right", open: "false", powered: "false" }];
    if (x === 2 || x === 5) return ["glass_pane", PANE_EW];
    return ["bricks"];                                       // brick piers between the glazing
  }
  if (d === "W" || d === "E") {                              // flanks: p = z
    if (z === 2 || z === 3 || z === 6 || z === 7) return ["glass_pane", PANE_NS];
    return z === 4 ? ["stone_bricks"] : ["bricks"];          // one stone pier per flank
  }
  return x === 2 || x === 5 ? ["glass_pane", PANE_EW] : ["bricks"];   // back: p = x
}

const g = new Voxels([8, 17, 9]);

for (const [x, z, ground] of cells) {
  const ring = edge(x, z), top = ring ? WALL_TOP : DECK_TOP;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation up to this cell's ground
  for (let y = ground; y < top; y++) {
    if (ring) { const [b, s] = wall(x, z, y); g.set(x, y, z, b, s); continue; }
    if (y === 0) g.set(x, y, z, (x + z) % 2 ? "smooth_stone" : "polished_andesite");   // chequered floor
    else if (y === top - 1) g.set(x, y, z, "deepslate_tiles");                       // slate deck over the hall
  }
}

// the skylight: four glass panes in the deck over the nave, lit from below
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) g.set(x, DECK_TOP - 1, z, "glass");

// warm light behind the glass, and hanging lanterns from the deck
g.set(2, 2, 1, "glowstone");
g.set(1, 2, 2, "glowstone");
g.set(6, 2, 6, "glowstone");
g.set(3, 2, 3, "glowstone");
g.set(2, 2, 4, "lantern", LANTERN);
g.set(5, 2, 4, "lantern", LANTERN);

// a flue through the deck on the front-east corner of the roof
g.set(6, DECK_TOP, 1, "bricks");
g.set(6, DECK_TOP + 1, 1, "bricks");

g.save(`${DIR}/DC62923.nbt`);
