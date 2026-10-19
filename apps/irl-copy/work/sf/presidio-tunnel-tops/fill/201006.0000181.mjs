// 201006.0000181: a three-storey Army administration block of the 1910s, cream stucco over a stone plinth, red tile
// roof behind a sandstone parapet. No record, so the era comes from the footprint and height: a long hollow block
// with a projecting entrance bay on its north face. Walls are one block thick, so the rooms behind the glass are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0000181.cells.json`, "utf8"));   // [x, z, ground]

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);

// The exterior face of a footprint cell: the first side with no footprint cell beyond it. Null = interior.
const faceOf = (x, z) =>
  !inside(x, z - 1) ? "N" : !inside(x, z + 1) ? "S" : !inside(x - 1, z) ? "W" : !inside(x + 1, z) ? "E" : null;
// The cell one step inside from a wall cell, so a light can sit behind its glass.
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([36, 18, 50]);
const PLINTH = "stone_bricks", WALL = "smooth_sandstone", BAND = "cut_sandstone", ROOF = "red_terracotta";
const GLASS = { S: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
                 N: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
                 E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
                 W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };

let lights = 0;
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  // Foundation and plinth: solid from y 0 up to the cell's ground, and the lowest course everywhere (interior floor too).
  g.set(x, 0, z, PLINTH);
  if (!f) {
    // Interior: storey floors at y 2 and 4, air between, the roof deck at y 6.
    g.set(x, 2, z, "oak_planks"); g.set(x, 4, z, "oak_planks"); g.set(x, 6, z, ROOF);
    continue;
  }
  // Exterior wall from the cell's ground up to the parapet; the downhill side has more courses below its windows.
  const c = f === "N" || f === "S" ? x : z;
  const bay = c % 4;                       // 0 and 3 piers (2 wide), 1 and 2 window bays (2 wide)
  const window = bay === 1 || bay === 2;
  const entrance = f === "N" && z === 0 && x >= 28 && x <= 32;
  // A corner stands on two exterior faces, one of each axis: its pier is a quoin.
  const corner = (!inside(x, z - 1) || !inside(x, z + 1)) && (!inside(x - 1, z) || !inside(x + 1, z));
  for (let y = gr; y <= 5; y++) {
    if (y === 2 || y === 4) { g.set(x, y, z, BAND); continue; }   // storey lines
    if (y === 0) continue;                                         // plinth already set
    if (entrance) {
      if (y === 1 || y === 2) {
        if (x === 29 || x === 30) {
          const half = y === 1 ? "lower" : "upper", hinge = x === 29 ? "left" : "right";
          g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
        } else if (y === 1) g.set(x, y, z, "glass_pane", GLASS[f]);
        continue;
      }
      if (y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }   // canopy
    }
    if (window && (y === 1 || y === 3 || y === 5)) {
      g.set(x, y, z, "glass_pane", GLASS[f]);
      // Warm light behind some ground and top-floor glass: one glowstone block inside, in the room's air.
      if (((x * 7 + z * 3 + y) % 9 === 0) && (y === 1 || y === 5)) {
        const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
        if (inside(ix, iz)) { g.set(ix, y, iz, "glowstone"); lights++; }
      }
      continue;
    }
    if (y === 1 || y === 3 || y === 5) { g.set(x, y, z, corner ? BAND : WALL); continue; }   // piers, quoined at corners
  }
  // Parapet and coping on the wall top.
  g.set(x, 6, z, WALL);
  g.set(x, 7, z, "cut_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance lantern hung under the canopy, inside the lobby (the storey floor at y 4 is its ceiling).
g.set(30, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: two rooftop units and one brick flue, all standing on the red roof.
for (let x = 8; x <= 13; x++) for (let z = 18; z <= 21; z++) g.set(x, 7, z, "light_gray_concrete");
for (let x = 16; x <= 19; x++) for (let z = 30; z <= 32; z++) g.set(x, 7, z, "smooth_stone");
for (let y = 7; y <= 9; y++) g.set(24, y, 12, "bricks");

const res = g.save(`${DIR}/201006.0000181.nbt`);
console.log(`built: ${res.blocks} blocks, ${res.palette} palette entries, ${lights} glowstone lights`);
