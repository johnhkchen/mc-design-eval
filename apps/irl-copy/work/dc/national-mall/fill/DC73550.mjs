// DC73550: National Guard Memorial Museum, 1 Massachusetts Ave NW, DC 20001, as a 1.21.1 module.
// Read as a mid-century Classical commercial block of pale limestone: a 3-storey wing (lidar roof 12) around a
// 4th-storey core (roof 14) set back on the middle of the footprint, plus a 1-storey annex (roof 5) at the
// north-west corner. Lidar roof heights are 5x5-median smoothed and snapped to those three tiers. Storeys are 4
// blocks (floor line, two window rows, spandrel), the top layer of each tier is the cover (parapet on the edge,
// roof membrane inside). Solid base course at y 0 under every cell, floors and spandrels full across each tier,
// so every layer stands on the one below. Perimeter walls carry piers and glazing, with an air gap behind the
// glass; the interior is air except for a few glowstone lights behind windows. The main door faces north (-z) on
// the row-0 front, with a copper canopy over it and a hanging lantern inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73550.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73550.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tiers from the smoothed lidar roof: 5 (annex), 12 (wings), 14 (core). The top layer of a tier is roof - 1.
const tierOf = (r) => (r <= 8 ? 5 : r <= 12 ? 12 : 14);
const top = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  top.set(key(c.x, c.z), tierOf(vals[vals.length >> 1]) - 1);
}
const T = (x, z) => top.get(key(x, z));

// Exposed sides: a neighbour outside the footprint, or one on a lower tier (the setback's face).
const exposed = (x, z) => DIRS.filter(([dx, dz]) => {
  const n = T(x + dx, z + dz); return n === undefined || n < T(x, z);
});
const isPerimeter = (x, z) => exposed(x, z).length > 0;
// Facade rhythm: along an east/west face the index is z, along a north/south face it is x. Every third is a pier.
const facadeIndex = (x, z, [dx]) => (dx !== 0 ? z : x);
const isPier = (x, z) => {
  const E = exposed(x, z);
  if (E.length !== 1) return true;                       // corners are piers
  return facadeIndex(x, z, E[0]) % 3 === 0;
};

const g = new Voxels([24, 26, 23]);
const ENTRY_X = [16, 17, 18];                              // the door bay on the row-0 front (north face)
const isEntryGlass = (x, z) => z === 0 && (x === 16 || x === 18);

for (const { x, z } of F.values()) {
  const t = T(x, z), P = isPerimeter(x, z);
  for (let y = 0; y <= t; y++) {
    const r = y % 4;
    if (y === 0) g.set(x, y, z, "polished_andesite");                       // base course, foundation
    else if (y === t) g.set(x, y, z, P ? "calcite" : "smooth_stone");        // parapet on the edge, roof membrane inside
    else if (r === 0) g.set(x, y, z, "smooth_quartz");                       // floor line
    else if (r === 3) g.set(x, y, z, "calcite");                             // spandrel and ceiling
    else if (P) {                                                            // window rows, r = 1 and 2
      if (isEntryGlass(x, z)) g.set(x, y, z, "light_blue_stained_glass");
      else if (z === 0 && x === 17 && y <= 2) continue;                      // door, set below
      else if (isPier(x, z)) g.set(x, y, z, "calcite");
      else g.set(x, y, z, "light_blue_stained_glass");
    }
    // else: interior air behind the glass
  }
}

// Entrance: the door (two halves, facing north), a copper canopy over the bay, a hanging lantern just inside.
g.set(17, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(17, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 15; x <= 19; x++) for (let z = 0; z <= 1; z++) if (inF(x, z)) g.set(x, 3, z, "waxed_oxidized_cut_copper");
g.set(17, 2, 1, "lantern", { hanging: "true" });

// Warm light behind some windows: glowstone on the floor of the room inside a glazed bay.
for (const { x, z } of F.values()) {
  if (!isPerimeter(x, z) || isEntryGlass(x, z)) continue;
  const E = exposed(x, z);
  if (E.length !== 1) continue;
  const [dx, dz] = E[0];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || isPerimeter(ix, iz)) continue;
  for (const s of [0, 1, 2]) {
    const yLo = 4 * s + 1;
    if (yLo >= T(x, z) || yLo > T(ix, iz)) continue;
    if (isPier(x, z) || (x * 5 + z * 3 + s * 2) % 13 !== 0) continue;
    g.set(ix, yLo, iz, "glowstone");
  }
}

// Roof plant on the core: two copper-clad boxes on the penthouse roof, a smaller one on top of the first.
for (const { x, z } of F.values()) {
  if (T(x, z) !== 13 || x < 10 || x > 13 || z < 7 || z > 10) continue;
  g.set(x, 14, z, "waxed_oxidized_copper");
  if (x >= 11 && x <= 12 && z >= 8 && z <= 9) g.set(x, 15, z, "waxed_oxidized_copper");
}

const { blocks, palette } = g.save(OUT);
console.log(`DC73550: ${blocks} blocks, palette ${palette}`);
