// 1339 14th St NW (Commercial-Retail-Misc), a ~1910s-20s brick commercial block on the street: a ground-floor
// shopfront (granite kickplate, glass bays on dark-oak piers, calcite fascia), brick upper walls with glazed window
// bays, a calcite string course and cornice, and a taller false-front parapet over the west bays. The lidar roof is
// snapped into flat tiers: 8 (front parapet, x0..9), 5 (body), 4 (lower wing, x13..14), 6 (corner bay, x15..17).
// The street is the z=0 face (north); z=2 is the back. z=1 is the interior: air only behind shop glass with a slab
// above and below, and solid elsewhere so nothing stands on air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56277.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell

// smoothed roof tier per cell (the lidar's raw noise is snapped to these)
const roofTier = (x, z) => {
  if (z === 0 && x <= 9) return 8;          // front parapet tower over the west bays
  if (x >= 13 && x <= 14) return 4;         // lower wing, a setback down
  if (x >= 15 && x <= 17 && z < 2) return 6; // corner bay rises
  if (x === 18) return 4;                   // east end wall
  return 5;                                 // body
};

const DOOR = [1, 7];                 // entrance bays on the street face
const PIER = (x) => x % 3 === 0;     // shopfront and window piers
const LIGHT = { 2: "lantern", 4: "glowstone", 8: "lantern", 10: "glowstone", 16: "lantern" }; // warm lights behind shop glass

const g = new Voxels([19, 20, 3]);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, G] of cells) {
  const front = z === 0;
  const tower = front && x <= 9;
  const top = tower ? 7 : roofTier(x, z) - 1;   // top block index (the roof's top surface is top + 1)
  const doorHere = front && DOOR.includes(x);

  for (let y = 0; y <= top; y++) {
    if (y < G) { g.set(x, y, z, "stone_bricks"); continue; }                   // foundation under the ground
    if (y === G) { g.set(x, y, z, "polished_granite"); continue; }             // plinth / floor course
    if (y === top) { g.set(x, y, z, front ? "stone_bricks" : "smooth_stone"); continue; } // cornice or roof deck

    if (front) {
      if (y === G + 1) {                                                       // shopfront
        if (doorHere) g.set(x, y, z, "dark_oak_door", doorState("lower"));
        else g.set(x, y, z, PIER(x) ? "dark_oak_planks" : "glass");
      } else if (y === G + 2) {                                                // fascia / door head
        if (doorHere) g.set(x, y, z, "dark_oak_door", doorState("upper"));
        else g.set(x, y, z, "calcite");
      } else if (tower && y === 4) {                                           // string course on the false front
        g.set(x, y, z, "calcite");
      } else if (doorHere && y === G + 3) {                                    // canopy over the door
        g.set(x, y, z, "black_concrete");
      } else {                                                                 // upper window band
        g.set(x, y, z, PIER(x) ? "bricks" : "glass_pane");
      }
      continue;
    }

    // z = 1 (interior, air only behind shop glass) and z = 2 (back wall)
    if (y === G + 1 && z === 1 && G + 2 < top) {
      if (LIGHT[x]) g.set(x, y, z, LIGHT[x], LIGHT[x] === "lantern" ? { hanging: "true", waterlogged: "false" } : undefined);
      continue;                                                                // air gap behind the glass
    }
    if (y === G + 2) { g.set(x, y, z, "smooth_stone"); continue; }             // floor slab per storey
    if (z === 2 && y === G + 3 && !PIER(x)) { g.set(x, y, z, "glass_pane"); continue; } // back windows
    g.set(x, y, z, "bricks");
  }
}

// roof equipment on the body's roof deck (each sits on the solid roof below)
g.set(3, 5, 1, "light_gray_concrete");
g.set(4, 5, 1, "light_gray_concrete");
g.set(11, 5, 2, "light_gray_concrete");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56277.nbt");
console.log(out);
