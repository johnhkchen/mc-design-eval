// Way 1095572139: a two-storey interwar brick shophouse with a single-storey shop wing on its west end.
// Era read from the lidar (8-block main roof, 4-block wing, 3-cell street frontage): a plastered brick
// commercial block of the 1920s-30s, shopfront at street level, sash-style window grid above, a cornice and parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572139.cells.json`, "utf8"));

// Lidar roof heights smoothed into two flat tiers: 7s and 8s are one 8-block roof, the 4s a single-storey wing.
const byKey = new Map();
for (const [x, z, ground, roofRaw] of cells) byKey.set(`${x},${z}`, { x, z, ground, top: roofRaw >= 6 ? 8 : 4 });
const at = (x, z) => byKey.get(`${x},${z}`);

// Outward faces: west -x, east +x, north -z (the street side, z 0), south +z.
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// A cell's walls at height y face each neighbour that is outside the footprint or lower than y.
const facesAt = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top <= y; });
// The parapet runs round the roof edge: a neighbour outside the footprint or one with a lower roof.
const rimAt = (c) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });

const g = new Voxels([13, 21, 10]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

let lights = 0;
for (const c of byKey.values()) {
  const { x, z, top: R } = c;
  put(x, 0, z, "stone_bricks");                                   // ground course: the floor slab under everything

  // Roof: a flat cornice course on the edge, roof deck inside, a parapet on the rim, and a plant box on the main roof
  for (let y = 1; y < R; y++) {
    if (y === R - 1) { put(x, y, z, facesAt(c, y).length ? "smooth_stone" : "stone_bricks"); continue; }
    if (y === 4 && R === 8) { put(x, y, z, "smooth_stone"); continue; }   // first-floor slab = string course
    const fs = facesAt(c, y);
    if (!fs.length) continue;                                     // interior air behind the wall
    if (y === 1) {
      if (c.x === 3 && c.z === 0) put(x, 1, z, "oak_door", { ...DOOR, half: "lower" });
      else put(x, 1, z, "stone_bricks");                          // base course
    } else if (y === 2) {
      if (c.x === 3 && c.z === 0) put(x, 2, z, "oak_door", { ...DOOR, half: "upper" });
      else put(x, 2, z, fs.length >= 2 ? "white_concrete" : "glass_pane");   // shopfront glass between plaster piers
    } else if (y === 3) {
      put(x, 3, z, "dark_oak_planks");                            // timber fascia
    } else {                                                      // upper storey: a sash grid, piers every third cell
      const along = fs.some(([dx]) => dx !== 0) ? z : x;
      if (fs.length >= 2 || along % 3 === 0) put(x, y, z, "white_concrete");
      else {
        put(x, y, z, "glass_pane");
        // a warm glowstone just inside some windows, on the floor slab
        if (y === 5 && (along + x + z) % 2 === 0) {
          const [dx, dz] = fs[0], ix = x - dx, iz = z - dz, n = at(ix, iz);
          if (n && n.top > y && !facesAt(n, y).length) { put(ix, y, iz, "glowstone"); lights++; }
        }
      }
    }
  }
  if (rimAt(c).length) put(x, R, z, "bricks");                    // parapet on the rim
}
// plant box on the main roof, set on the roof deck
for (const [x, z] of [[6, 5], [7, 5], [6, 6], [7, 6]]) put(x, 8, z, "stone_bricks");

// Check: every block must stand on, or sit against, a block of the same build (nothing hangs in the air)
let hanging = 0;
g.forEachCell((i) => {
  const X = 13, Y = 21, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  const below = g.val(x, y - 1, z);
  const side = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => g.val(x + dx, y + dy, z + dz));
  if (!below && !side) hanging++;
});
const res = g.save(`${DIR}/way_1095572139.nbt`);
console.log(JSON.stringify({ ...res, hanging, glowstone: lights }));
