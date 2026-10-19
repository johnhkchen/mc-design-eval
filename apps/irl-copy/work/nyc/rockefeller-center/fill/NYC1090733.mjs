// 153 West 48th Street (2018, commercial and office). A glass-and-spandrel office block on a granite base:
// the lidar roof snapped to 3-block storeys (1 + 3k), so the massing steps down in flat tiers from the 7-storey
// west tip to the 6-storey core, the 5-storey east and south shoulders and the 2-storey north wings. The south
// face is the street front: a recessed entrance under a black lintel. Every column is solid except one air block
// behind each glass row, so nothing hangs: floors and ceilings are slabs, the envelope stands on them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1090733.cells.json", "utf8"));
const W = 29, D = 28, H = 33;

// Lidar roof (blocks above y 0) -> storey tier: body is y < T, and T is 1 or 4, 7, 10, ... so every top is a roof at 3k+2.
const tierOf = (r) => (r <= 1 ? 1 : r <= 4 ? 4 : r <= 7 ? 7 : r <= 10 ? 10 : r <= 13 ? 13 : r <= 16 ? 16 : r <= 19 ? 19 : 22);
const tops = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, tierOf(r)]));
const top = (x, z) => tops.get(`${x},${z}`) ?? 0;          // outside the footprint counts as 0: exposed everywhere
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// An exposed face at height y: the neighbour outside the footprint, or standing lower than y (a setback edge).
const faces = (x, z, y) => NB.filter(([dx, dz]) => top(x + dx, z + dz) <= y);

const g = new Voxels([W, H, D]);
const GLASS = (x, y, z) => ((x * 5 + z * 3 + y) % 7 === 0 ? "gray_stained_glass" : "light_blue_stained_glass");

// The street front (z 26) is the one entrance: a glass shopfront with a door in the middle bay and a black lintel.
function special(x, z, y) {
  if (z !== 26 || ![14, 15, 16].includes(x)) return null;
  if (y === 4) return ["black_concrete"];
  if (x === 15 && y === 2) return ["dark_oak_door", { half: "lower", facing: "south", hinge: "left", open: "false", powered: "false" }];
  if (x === 15 && y === 3) return ["dark_oak_door", { half: "upper", facing: "south", hinge: "left", open: "false", powered: "false" }];
  return null;
}

for (const [x, z] of cells) {
  const t = top(x, z);
  g.set(x, 0, z, "polished_granite");                       // granite base course on every footprint cell
  for (let y = 1; y < t; y++) {
    const sp = special(x, z, y);
    if (sp) { g.set(x, y, z, sp[0], sp[1]); continue; }
    const k = (y - 1) % 3;                                  // 0 = floor line (spandrel), 1 and 2 = glass rows
    const fs = faces(x, z, y);
    if (!fs.length) {                                       // interior: slab floor and ceiling, one air row between
      if (k === 0 || y === t - 1) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "smooth_quartz"); continue; }      // cornice on the exposed top
    if (k === 0) { g.set(x, y, z, y === 1 ? "polished_granite" : "smooth_quartz"); continue; }  // base / spandrel band
    const [dx] = fs[0];
    const along = dx !== 0 ? z : x;                         // bays: a mullion every third block along the face
    if (along % 3 === 0) g.set(x, y, z, y <= 3 ? "black_concrete" : "white_concrete");
    else g.set(x, y, z, y <= 3 ? "light_blue_stained_glass" : GLASS(x, y, z));
  }
}

// Penthouse on the central 19-block tier: a plant room set back from the edges, its top a light roof.
for (let x = 8; x <= 11; x++) for (let z = 9; z <= 11; z++) {
  if (top(x, z) !== 19) continue;
  g.set(x, 19, z, "gray_concrete"); g.set(x, 20, z, "gray_concrete"); g.set(x, 21, z, "light_gray_concrete");
}

// Roof terrace on the 16-block east tier: planters in a checker of leaves.
for (let x = 23; x <= 25; x++) for (let z = 17; z <= 19; z++) {
  if (top(x, z) === 16 && (x + z) % 2 === 0) g.set(x, 16, z, "oak_leaves", { persistent: "true" });
}

// Warm lights behind some glass: the air row of a glass storey, on its floor slab, inside an interior cell.
for (const [x, z] of cells) {
  for (let y = 2; y < top(x, z); y += 3) {                 // air rows (k = 1)
    const fs = faces(x, z, y);
    if (!fs.length) continue;
    const [dx, dz] = fs[0];
    const ix = x - dx, iz = z - dz;
    if (!tops.has(`${ix},${iz}`) || top(ix, iz) <= y || faces(ix, iz, y).length) continue;
    if ((x * 37 + z * 53 + y * 11) % 16 !== 0) continue;
    if (y === 2) g.set(ix, y, iz, "lantern", { hanging: "false" });
    else g.set(ix, y, iz, (x + z) % 9 ? "glowstone" : "shroomlight");
  }
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1090733.nbt");
console.log(JSON.stringify({ footprint: cells.length, ...res }));
