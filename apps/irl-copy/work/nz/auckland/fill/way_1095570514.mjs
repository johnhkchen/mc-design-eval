import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1920s-30s Auckland brick commercial block (lidar roof 6 blocks, ~1.5 storeys): a stone plinth,
// a shopfront with a recessed door on the street (north) face, a stone storey band, a row of
// clerestory windows above it, a stone cornice and a flat roof with plant. Built on the footprint only.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570514.cells.json", "utf8"));
const g = new Voxels([9, 19, 7]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => cell.has(key(x, z));

// which sides of a footprint cell face outside it
const exposed = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const faces = (e) => Object.values(e).filter(Boolean).length;
const onStreetAxis = (e) => e.N || e.S;                          // a wall running east-west

// glass sits at odd positions along an outward wall; the street door takes the place of one
const DOOR = { x: 2, z: 0 };
const isWindow = (x, z) => {
  const e = exposed(x, z);
  if (!faces(e) || (x === DOOR.x && z === DOOR.z)) return false;
  return onStreetAxis(e) ? x % 2 === 1 : z % 2 === 1;
};
const paneState = (x, z) => (onStreetAxis(exposed(x, z))
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [k, { ground, roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const e = exposed(x, z), wall = faces(e) > 0;
  const door = wall && x === DOOR.x && z === DOOR.z;
  const win = wall && isWindow(x, z);

  for (let y = 0; y < roof; y++) {                                // the lidar roof height: courses 0..roof-1
    if (y < ground) continue;
    if (y === 0) {
      g.set(x, y, z, wall ? "polished_andesite" : "smooth_stone");     // plinth; ground floor slab
    } else if (y === 1 || y === 2) {
      if (door) g.set(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper"));
      else if (win) g.set(x, y, z, "glass_pane", paneState(x, z));
      else if (wall) g.set(x, y, z, "bricks");
      // interior air: the shop room
    } else if (y === 3) {
      g.set(x, y, z, wall ? "stone_bricks" : "smooth_stone");     // storey band; floor slab over the shop
    } else if (y === 4) {
      if (win) g.set(x, y, z, "glass_pane", paneState(x, z));
      else if (wall) g.set(x, y, z, "bricks");
    } else if (y === 5) {
      g.set(x, y, z, wall ? "smooth_stone_slab" : "stone", wall ? { type: "bottom", waterlogged: "false" } : undefined);  // cornice; roof deck
    }
  }
}

// warm light behind the glass: glowstone low in the shop, shroomlight high in the upper room
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (faces(exposed(x, z)) > 0) continue;                          // interior cells only
  const glassNear = [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]].some(([lx, lz]) => isWindow(lx, lz));
  if (!glassNear) continue;
  if ((x + z) % 2 === 0) g.set(x, 1, z, "glowstone");
  else g.set(x, 4, z, "shroomlight");
}

// roof plant: two condenser units on the roof deck
const roofInterior = [...cell.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => faces(exposed(x, z)) === 0)
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
if (roofInterior.length) {
  const [a] = roofInterior, b = roofInterior[roofInterior.length - 1];
  g.set(a[0], 6, a[1], "iron_block");
  g.set(b[0], 6, b[1], "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570514.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
