import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC64247: a Federal-era (c. 1930s) stone office block on the Mall's east end, Portland-limestone walls, smooth
// quartz bands and cornices, a narrow glazed bay per floor, a 3x3 attic tower at the north end and a one-storey wing
// to the south. Footprint 3 x 11: x 0..2 (west to east), z 0..10 (north to south).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64247.cells.json", "utf8"));
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, r); }

// Lidar tiers, smoothed: the main block is 7 (cornice at y 6), the north-middle bay rises to 8 (attic parapet at y 7),
// the south wing is 3 (one storey, cornice at y 2).
const tier = (x, z) => {
  const r = roof.get(`${x},${z}`);
  if (r <= 4) return 3;
  return z >= 1 && z <= 3 ? 8 : 7;
};

const g = new Voxels([3, 9, 11]);
const WALL = "calcite", TRIM = "smooth_quartz", BASE = "stone_bricks", GLASS = "light_blue_stained_glass_pane";
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const isEnd = (z) => z === 0 || z === 10;
const interior = (x, z) => x === 1 && z >= 1 && z <= 9;   // the air gap behind the glazing

for (let z = 0; z < 11; z++) for (let x = 0; x < 3; x++) {
  if (!ground.has(`${x},${z}`)) continue;
  const gr = ground.get(`${x},${z}`), top = tier(x, z);
  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  if (top === 3) {                       // south wing: base, one glazed storey, cornice
    g.set(x, 0, z, BASE);
    g.set(x, 1, z, BASE);
    if (!interior(x, z)) {
      if (isEnd(z)) g.set(x, 1, z, x === 1 ? GLASS : WALL, x === 1 ? paneEW : undefined);
      else if (x !== 1) g.set(x, 1, z, z % 2 === 1 ? GLASS : WALL, z % 2 === 1 ? paneNS : undefined);
    }
    g.set(x, 2, z, TRIM);                // cornice / roof
    continue;
  }

  // main block and tower: base course (y 0..1), ground storey glazing (y 2), transom (3), floor (4),
  // upper glazing (5), cornice or floor (6), attic parapet (7, tower only)
  g.set(x, 0, z, BASE);
  g.set(x, 1, z, BASE);
  g.set(x, 4, z, TRIM);                  // floor slab / string course, interior included
  const top6 = top === 8 ? TRIM : TRIM;
  g.set(x, 6, z, top6);                  // cornice (or floor under the tower's attic)
  if (top === 8) g.set(x, 7, z, WALL);   // attic parapet

  const bay = z % 2 === 1;               // glazed bays on odd z, calcite piers on even
  for (const yy of [2, 5]) {
    if (interior(x, z)) continue;
    if (x === 1) {                       // end-wall centre light (z 0 / 10)
      g.set(x, yy, z, isEnd(z) ? GLASS : WALL, isEnd(z) ? paneEW : undefined);
    } else if (bay && !isEnd(z)) {
      g.set(x, yy, z, GLASS, paneNS);
    } else {
      g.set(x, yy, z, WALL);
    }
  }
  if (!interior(x, z) && x !== 1) g.set(x, 3, z, bay ? WALL : WALL);   // transom band
  if (!interior(x, z) && x === 1 && isEnd(z)) g.set(x, 3, z, WALL);
}

// Ground-floor entrance on the west face at z 5: a dark oak door (y 2..3) with hanging lanterns either side
g.set(0, 2, 5, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 3, 5, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(0, 3, 4, "lantern", { hanging: "true", waterlogged: "false" });
g.set(0, 3, 6, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light behind the glass: lanterns in the air gap (standing on the floor, hanging from the slabs above), and a
// lightning rod on the attic
g.set(1, 2, 3, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 5, 3, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, 5, 7, "lantern", { hanging: "true", waterlogged: "false" });
g.set(1, 8, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Roof equipment: an air-handling unit on the wing's cornice
g.set(2, 3, 10, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64247.nbt";
console.log(g.save(out));
