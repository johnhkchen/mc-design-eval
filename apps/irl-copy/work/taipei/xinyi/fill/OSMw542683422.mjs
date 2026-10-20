import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Taipei commercial block, c. 1990s: white tiled concrete frame,
// light-blue glass curtain bands, granite base, quartz cornice and parapet,
// glass shopfront and a central entrance on the south (+z) face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683422";
const W = 21, H = 23, D = 13;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr)]);
const cellMap = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => cellMap.has(`${x},${z}`);

const G0 = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const F1 = G0 + 5;                                  // second-storey floor line
const T = G0 + 10;                                  // roof deck / cornice
const PAR = T + 1;                                  // parapet course
const zMax = Math.max(...cells.map((c) => c[1]));

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// inward direction from a perimeter cell, used to place lights in the air gap
const inward = (x, z) => {
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
};

for (const [x, z, gr] of cells) {
  const gc = Math.min(gr, T - 2);
  const perim = isPerim(x, z);

  // foundation fill up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slabs only, air above (no interiors)
    put(x, gc, z, "smooth_stone");
    if (F1 > gc && F1 < T) put(x, F1, z, "smooth_stone");
    put(x, T, z, "gray_concrete");
    continue;
  }

  // perimeter facade
  put(x, gc, z, "polished_granite");               // base course
  const levels = [gc];
  if (F1 > gc && F1 < T) levels.push(F1);
  levels.push(T);

  const idx = z === 0 || z === zMax ? x : z;      // position along the facade
  const corner = isCorner(x, z);

  for (let y = gc + 1; y < T; y++) {
    if (levels.includes(y)) {                     // storey line
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    let base = gc;
    for (const l of levels) if (l < y && l > base) base = l;
    const r = y - base;

    if (r === 4) { put(x, y, z, "white_concrete"); continue; }   // spandrel
    if (r >= 1 && r <= 3) {
      if (idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // mullion
      const shop = y < F1 && base === gc;
      put(x, y, z, shop ? "glass" : "light_blue_stained_glass");
      // warm light in the air gap behind some panes
      if ((x + z + y) % 5 === 0) {
        const [ix, iz] = inward(x, z);
        if (has(ix, iz) && !isPerim(ix, iz)) {
          put(ix, y, iz, (x + y) % 2 === 0 ? "glowstone" : "shroomlight");
        }
      }
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // cornice and parapet
  put(x, T, z, "smooth_quartz");
  put(x, PAR, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// main entrance on the south face, centred
let ex = Math.floor(W / 2);
if (!has(ex, zMax)) {
  const cand = cells.filter((c) => c[1] === zMax).map((c) => c[0]).sort((a, b) => a - b);
  ex = cand[Math.floor(cand.length / 2)];
}
const egc = Math.min(cellMap.get(`${ex},${zMax}`), T - 2);
put(ex, egc + 1, zMax, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, egc + 2, zMax, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, egc + 3, zMax, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on interior roof cells
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, T + 1, z, "gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
