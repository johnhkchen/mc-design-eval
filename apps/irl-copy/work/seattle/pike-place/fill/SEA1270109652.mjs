// Pier 62 & 63 Park pavilion (Park, Public: Zoo/Arbor; 1901 Alaskan Way). The lidar record puts the roof about
// 4 blocks above the lowest ground, so it is one low storey, not five-block storeys: a red-brick pier shed on a
// stone plinth, a sandstone storey band and cornice, timber sash in brick piers, two timber-framed entrances with
// hanging lanterns, a flat roof with a skylight and a brick flue, and stone pylons at the four tips of the plan.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270109652.cells.json", "utf8"));   // [x, z, ground] per footprint cell, x 0..10, z 0..10

const g = new Voxels([11, 16, 11]);
const ground = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const has = (x, z) => ground.has(`${x},${z}`);
const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const outward = (x, z) => Object.keys(OUT).filter((d) => !has(x + OUT[d][0], z + OUT[d][1]));
const DOORS = [{ x: 9, z: 8, facing: "south" }, { x: 2, z: 2, facing: "north" }];   // SE and NW entrances, on the stepped faces
const doorAt = (x, z) => DOORS.find((d) => d.x === x && d.z === z);

// Roof kit and the warm rooms, decided once so the walls can read them.
const SKYLIGHT = ["6,5", "6,6"];
const FLUE = "3,4";

for (const [x, z, gy] of cells) {
  const key = `${x},${z}`;
  const out = outward(x, z);
  const boundary = out.length > 0;
  const tip = out.length >= 3;                           // the four points of the plan, where the walls turn most

  // Foundation under the cell up to its ground, then the floor slab at ground level.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gy, z, boundary ? "stone_bricks" : "smooth_stone");

  if (!boundary) {
    // Air gap above the floor slab; the roof deck closes it at 4 blocks. Skylight and flue sit in the deck.
    if (SKYLIGHT.includes(key)) g.set(x, gy + 3, z, "glass");
    else g.set(x, gy + 3, z, "smooth_stone");
    if (key === FLUE) { g.set(x, gy + 4, z, "bricks"); g.set(x, gy + 5, z, "bricks"); g.set(x, gy + 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
    continue;
  }

  const door = doorAt(x, z);
  const idx = x + z;                                     // one index along the stepped walls: piers and bays
  const pier = tip || idx % 3 === 0;

  for (const y of [1, 2]) {
    if (door) {
      // the entrance is two blocks tall; the door sits in the wall cell itself
      if (y === 1) g.set(x, gy + 1, z, "dark_oak_door", { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, gy + 2, z, "dark_oak_door", { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (tip) {
      g.set(x, gy + y, z, "stone_bricks");
    } else if (pier) {
      g.set(x, gy + y, z, "bricks");
    } else {
      g.set(x, gy + y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });   // connected below
    }
  }

  // Storey band and cornice: sandstone all round, timber lintel over the entrances, stone pylons on the tips.
  g.set(x, gy + 3, z, door ? "dark_oak_planks" : "smooth_sandstone");
  if (tip) g.set(x, gy + 4, z, "stone_brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
}

// Sash panes join their neighbours in the wall, so the window bands read as continuous rows, not single panes.
for (const [x, z, gy] of cells) {
  if (!outward(x, z).length || doorAt(x, z)) continue;
  const at = (y) => g.get(x, gy + y, z);
  if (!at(1) || at(1).block !== "minecraft:glass_pane") continue;
  for (const y of [1, 2]) {
    const conn = Object.fromEntries(Object.entries(OUT).map(([d, [dx, dz]]) => {
      const n = g.get(x + dx, gy + y, z + dz);
      return [d, has(x + dx, z + dz) && n && (n.block === "minecraft:glass_pane" || n.block === "minecraft:bricks" || n.block === "minecraft:stone_bricks") ? "true" : "false"];
    }));
    g.set(x, gy + y, z, "glass_pane", { ...conn, waterlogged: "false" });
  }
}

// Warm light behind some sash on the interior side, and a hanging lantern in each entrance hall.
for (const [x, z, gy] of cells) {
  const out = outward(x, z);
  if (!out.length || doorAt(x, z)) continue;
  const at = g.get(x, gy + 1, z);
  if (!at || at.block !== "minecraft:glass_pane") continue;
  if ((x + z) % 6 !== 1) continue;
  const [dx, dz] = OUT[out[0]];
  const ix = x - dx, iz = z - dz;                          // inside, one step from the wall
  if (has(ix, iz) && !outward(ix, iz).length) g.set(ix, gy + 1, iz, "glowstone");
}
for (const d of DOORS) {
  const gy = ground.get(`${d.x},${d.z}`);
  const [dx, dz] = OUT[d.facing];
  const ix = d.x - dx, iz = d.z - dz;
  if (has(ix, iz)) g.set(ix, gy + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270109652.nbt");
console.log(JSON.stringify(info));
