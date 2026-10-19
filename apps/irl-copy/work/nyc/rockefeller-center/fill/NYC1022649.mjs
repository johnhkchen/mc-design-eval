// 144 West 46 Street, 1920: a five-storey red-brick Renaissance-style mixed-use block (shopfront and entrance on the
// street end, brick and limestone storey lines above), with a three-storey rear wing and a stair bulkhead on the roof.
// Lidar roof heights smoothed into two flat tiers: the body (z 0..18) at 15, the rear wing (z 19..21) at 9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022649.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => foot.has(key(x, z));
const roofOf = (z) => (z <= 18 ? 15 : 9);            // roof row of the body / the rear wing (parapet sits one above)

// Which of E, W, S, N a wall cell faces open: outside the footprint, or a lower tier it rises above.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function exposed(x, z, y) {
  const R = roofOf(z);
  return DIRS.map(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz)) return true;
    const Rn = roofOf(nz);
    return Rn < R && y > Rn;
  });
}
const any = (a) => a.some(Boolean);

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // on an east/west face
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // on a north/south face
const door = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([5, 28, 22]);

// A warm light behind a window: only into an interior air cell (the glass keeps its air gap otherwise).
function lampBehind(x, y, z, block = "glowstone") {
  if (!inF(x, z) || any(exposed(x, z, y))) return;
  g.set(x, y, z, block);
}

// The window-row block of a street-facing or side-facing wall cell (rows 1 and 2 of each storey).
function facade(x, z, y, ex) {
  const [E, W, S, N] = ex;
  const s = Math.floor(y / 3), sill = y % 3 === 1;
  if (z === 0) {                                              // street end: shopfront, entrance, then upper bays
    if (x === 2 && s === 0) return ["oak_door", door(y === 1 ? "lower" : "upper", "north")];
    if (x === 2) { if (sill && s % 2 === 1) lampBehind(2, y, 1); return ["glass_pane", PANE_EW]; }
    if (s === 0) { if (sill) lampBehind(x, y, 1, "lantern"); return ["glass_pane", PANE_EW]; }
    return ["bricks"];
  }
  if ((E || W) && (S || N)) return ["bricks"];               // corner pier
  if (E || W) {                                               // long side: piers on every third column
    if (z % 3 === 1) return ["bricks"];
    if (sill && (z + 2 * s) % 5 === 0) lampBehind(E ? x - 1 : x + 1, y, z);
    return ["glass_pane", PANE_NS];
  }
  if (x === 1 || x === 4) return ["bricks"];                  // rear and step faces: glass between two piers
  if (sill && (s + x) % 3 === 0) lampBehind(x, y, z - 1);
  return ["glass_pane", PANE_EW];
}

for (const [x, z] of cells) {
  const R = roofOf(z);
  for (let y = 0; y <= R + 1; y++) {
    const ex = exposed(x, z, y), out = any(ex);
    if (y === R + 1) {                                        // parapet, coped at every third block
      if (out) g.set(x, y, z, (x + z) % 3 === 0 ? "calcite" : "bricks");
    } else if (y === R) {                                     // roof deck, limestone cornice at the edge
      g.set(x, y, z, out ? "calcite" : "stone");
    } else if (y === 0) {                                     // base course on the street
      g.set(x, y, z, out ? "stone_bricks" : "smooth_stone");
    } else if (y % 3 === 0) {                                 // storey line: limestone sill and lintel
      if (!out) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, z === 0 && y === 3 ? "dark_oak_planks" : "calcite");   // shop fascia over the ground floor
    } else if (out) {
      const [block, state] = facade(x, z, y, ex);
      g.set(x, y, z, block, state);
    }
  }
}

// Stair bulkhead on the body roof, its door facing the roof.
for (let x = 1; x <= 3; x++) for (let z = 6; z <= 8; z++) {
  g.set(x, 16, z, "bricks"); g.set(x, 17, z, "bricks"); g.set(x, 18, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
g.set(2, 16, 6, "oak_door", door("lower", "north")); g.set(2, 17, 6, "oak_door", door("upper", "north"));

console.log(g.save(`${dir}/NYC1022649.nbt`));
