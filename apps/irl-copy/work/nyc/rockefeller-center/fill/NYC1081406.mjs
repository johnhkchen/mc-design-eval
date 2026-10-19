// CBS Building, 51 West 52nd Street: a 1964 Commercial & Office tower (NYC individual landmark), black polished granite
// and bronze-grey glass in a sheer slab. Lidar reads one flat roof at 134-137 across the whole footprint, so the massing
// is one 45-storey tier (135 blocks = 45 storeys of 3) with its lidar noise smoothed away, a cornice and parapet
// on top, and a small roof penthouse over the 137-block cluster at x 26-33, z 13-17.
// The street face is low z (north). Piers every 4 blocks run the full height; the spandrel at each storey line
// (y % 3 == 0) is dark stone. Windows are glass one block back in the pier and spandrel plane, with air behind
// and a floor slab in each storey (no interiors); the glass sits in a recess. A two-storey base has shopfront glass
// and a recessed entrance under a canopy with a hanging lantern. Warm glowstone sits behind some panes.
// The footprint's lidar holes (roof 0-16) are smoothed to the slab, and the 1-block ground step is a foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081406.cells.json`, "utf8"));
const X = 44, Y = 141, Z = 36;
const TOP = 135;                                 // body top, 45 storeys of 3 blocks

const BASE = "polished_blackstone_bricks";       // base course, foundation, cornice band
const PIER = "polished_blackstone";              // full-height piers, frames
const SPANDREL = "polished_deepslate";           // dark storey lines
const CORE = "blackstone";                       // solid behind the air gap, never seen from the street
const GLASS = "gray_stained_glass";              // bronze-grey glazing, recessed one block
const LAMP = "glowstone";                        // warm light behind some panes

const foot = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Each cell's outward face is the nearest way out of the footprint along an axis (N/S win ties, so corners read as
// the long faces); depth is how many cells in from that face it sits (0 = the skin itself).
const RAYS = { N: [0, -1, 0], S: [0, 1, 0], W: [-1, 0, 0.5], E: [1, 0, 0.5] };
function faceOf(x, z) {
  let best = null;
  for (const [name, [dx, dz, pref]] of Object.entries(RAYS)) {
    let L = 0, cx = x, cz = z;
    while (inFoot(cx, cz)) { cx += dx; cz += dz; L++; }
    const score = L + pref;
    if (!best || score < best.score) best = { name, L, score };
  }
  return { face: best.name, depth: best.L - 1 };
}

const lit = (u, y, face) => (u * 7 + y * 5 + (face === "N" || face === "S" ? 0 : 3)) % 13 === 0;
const inPent = (x, z) => x >= 26 && x <= 33 && z >= 13 && z <= 17;

// The block (name, state) for one cell at height y, or null for air.
function block(x, y, z, c) {
  const { face, depth } = faceOf(x, z);
  const u = face === "N" || face === "S" ? x : z;

  if (inPent(x, z) && y >= 137 && y <= 140) {                                // roof penthouse
    if (y === 140) return ["chiseled_polished_blackstone"];
    const edge = x === 26 || x === 33 || z === 13 || z === 17;
    return edge && y === 138 ? [GLASS] : [SPANDREL];                        // a glazed band round the penthouse
  }
  if (y < c.ground) return [BASE];                                          // foundation under the sloped ground
  if (y >= 137) return null;
  if (y >= TOP) return depth === 0 ? [y === TOP ? "chiseled_polished_blackstone" : BASE] : [CORE];
  if (depth >= 3) return [CORE];

  // Recessed entrance under a canopy, on the street face (x 18-23, three blocks in from the wall).
  if (face === "N" && z <= 3 && x >= 17 && x <= 24) {
    if (y === 4) return ["chiseled_polished_blackstone"];                   // canopy
    if (y >= 1 && y <= 3 && (x === 18 || x === 23)) return [PIER];          // door frames
    if (y >= 1 && y <= 3 && x >= 19 && x <= 22) {
      if (depth === 2) return [GLASS];                                       // glass doors at the back of the recess
      if (depth === 0 && x === 20 && y === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
      return null;
    }
  }

  if (y === 0) return depth === 0 ? [BASE] : [CORE];                        // base course
  if (y <= 2) {                                                            // shopfront storey
    if (u % 4 === 0) return [PIER];
    if (depth === 0) return [GLASS];
    return depth === 1 ? null : [CORE];
  }
  if (u % 4 === 0) return [PIER];                                          // piers run the full height
  if (y % 3 === 0) return [SPANDREL];                                      // storey line
  if (depth === 0) return null;                                            // window: air in front of the glass
  if (depth === 1) return [GLASS];
  return lit(u, y, face) ? [LAMP] : null;                                  // air gap behind, a lamp in some
}

const g = new Voxels([X, Y, Z]);
for (const [x, z, ground] of cells) {
  for (let y = 0; y < Y; y++) {
    const b = block(x, y, z, { ground });
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
g.save(`${DIR}/NYC1081406.nbt`);
console.log("blocks", g.count());
