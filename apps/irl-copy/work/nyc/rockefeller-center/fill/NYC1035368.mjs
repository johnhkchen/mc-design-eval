// NYC1035368: 5 East 44 Street, a 2007 mixed residential and commercial building. The lidar roof per cell becomes a
// storey count (3 blocks each, a 2-block parapet off the lidar top). The south and west edge rises as a tower on a
// three-storey podium; the north side is a shopfront base with the street door. Glass is light blue, the piers calcite
// on the podium and grey concrete on the tower, granite at grade.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1035368.cells.json`, "utf8"));
const X = 8, Z = 10;

// Per cell: ground g, storeys n, roof deck at g + 3n, top (exclusive). A court (lidar at or just above grade) is a
// single-storey light-well roof with no parapet.
const C = new Array(X * Z).fill(null);
for (const [x, z, g, r] of cells) {
  const court = r <= g + 1;
  const n = court ? 1 : Math.max(1, Math.round((r - g - 2) / 3));
  const deck = g + 3 * n;
  C[z * X + x] = { g, n, deck, top: court ? deck + 1 : deck + 2, court, tower: n >= 5 };
}
const cellAt = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? null : C[z * X + x]);
const massing = (x, y, z) => { const c = cellAt(x, z); return !!c && y < c.top; };
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !massing(x + dx, y, z + dz));

const DOOR = { x: 3, z: 0 };   // the street door, north face

// The facade block for an exposed voxel at storey k, course row (1 or 2; row 0 is the floor line).
function facade(x, z, ex, c, k, row) {
  const [, , face] = ex[0];
  const ns = face === "north" || face === "south";
  const along = ns ? x : z, L = ns ? X : Z;
  const pier = along === 0 || along === L - 1 || along % 3 === 0;
  if (k === 0 && face === "north" && x === DOOR.x) {
    return ["dark_oak_door", { facing: "north", half: row === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (k === 0) return [pier ? "polished_granite" : "glass", null];
  if (pier) return [c.tower ? "smooth_quartz" : "calcite", null];
  return ["light_blue_stained_glass", null];
}

const g = new Voxels([X, 36, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = 0; y < c.top; y++) {
    const rel = y - c.g, ex = exposed(x, y, z), perim = ex.length > 0;
    if (y < c.g) { g.set(x, y, z, "polished_granite"); continue; }                            // foundation to grade
    if (rel === 3 * c.n) { g.set(x, y, z, "gray_concrete"); continue; }                        // roof deck
    if (rel === 3 * c.n + 1) { if (perim) g.set(x, y, z, "smooth_quartz"); continue; }         // parapet
    const k = Math.floor(rel / 3), row = rel % 3;
    if (row === 0) {                                                                           // floor line
      g.set(x, y, z, !perim ? "smooth_stone" : k === 0 ? "polished_granite" : c.tower ? "smooth_quartz" : "calcite");
      continue;
    }
    if (!perim) continue;                                                                      // air behind the glass
    if (row === 2 && k === c.n - 1) { g.set(x, y, z, "calcite"); continue; }                  // cornice under the parapet
    const [block, state] = facade(x, z, ex, c, k, row);
    g.set(x, y, z, block, state);
  }
}

// Warm light: glowstone just inside some upper-storey windows (interior cell must be empty air).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = cellAt(x, z); if (!c) continue;
  for (let y = c.g; y < c.top; y++) {
    const rel = y - c.g, k = Math.floor(rel / 3), row = rel % 3;
    const ex = exposed(x, y, z);
    if (!ex.length || k < 1 || row !== 1 || (x * 3 + z * 5 + k) % 4 !== 0) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz, ic = cellAt(ix, iz);
    if (!ic || y >= ic.top || exposed(ix, y, iz).length) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Roof plant: a few brick flues on the interior of the podium roof.
for (const [x, z] of [[4, 3], [5, 4], [2, 5], [5, 6]]) {
  const c = cellAt(x, z);
  if (!c || exposed(x, c.g + 1, z).length) continue;
  for (const y of [c.deck + 1, c.deck + 2]) g.set(x, y, z, "bricks");
}

const stats = g.save(`${HERE}/NYC1035368.nbt`);
console.log(JSON.stringify(stats));
