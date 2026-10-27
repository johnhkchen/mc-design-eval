// Way 912170779, Auckland (Mt Eden / Eden Terrace edge): a two-storey Edwardian brick shop-block with a cream
// Oamaru-style string course and parapet, a dark-oak shopfront with a door on its street (north) face, a lower
// single-storey-wing notch on the south-west corner, and a small roof plant box with two AC units on the flat roof.
// Lidar: flat roof at 11 above y0 (2 cells at 8 and 2 are the wing), ground 0 west and 1 east (foundation at y0).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170779.cells.json", "utf8"));

const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFP = (x, z) => FP.has(`${x},${z}`);
const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };          // z grows south, x east
const sidesOf = (x, z) => Object.keys(SIDE).filter((s) => !inFP(x + SIDE[s][0], z + SIDE[s][1]));  // faces onto air
const isPerim = (x, z) => sidesOf(x, z).length > 0;

const g = new Voxels([8, 24, 7]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const PANE = {
  N: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  S: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};
const DOOR = { x: 5, z: 0 };                                              // the shop door, on the street face
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const LANTERN_HANG = { hanging: "true", waterlogged: "false" };

const windows = [];   // perimeter cells with a glass bay: { x, z, side }

for (const [key, { roof }] of FP) {
  const [x, z] = key.split(",").map(Number);
  const sides = sidesOf(x, z);
  const perim = sides.length > 0;
  const corner = sides.length > 1;
  const street = sides.includes("N");                                     // the shop face
  const side = sides[0];
  // a single-face cell is a window bay on odd cells (piers between), never on a corner
  const along = side === "N" || side === "S" ? x : z;
  const bay = perim && !corner && along % 2 === 1;
  if (bay) windows.push({ x, z, side });

  // base course and foundation: solid from y 0 up to the lowest ground, for every cell
  put(x, 0, z, "stone_bricks");
  if (roof <= 2) { put(x, 1, z, "smooth_quartz"); continue; }             // the low lean-to at the wing's end

  // ground floor, y 1..3
  if (perim && street) {
    if (x === DOOR.x && z === DOOR.z) {
      put(x, 1, z, "dark_oak_door", DOOR_LOWER);
      put(x, 2, z, "dark_oak_door", DOOR_UPPER);
      put(x, 3, z, "dark_oak_planks");                                   // transom, solid so the fascia above has a bearing wall
    } else {
      put(x, 1, z, "dark_oak_planks");                                   // shopfront bulkhead
      put(x, 2, z, "glass_pane", PANE.N);
      put(x, 3, z, "glass_pane", PANE.N);
    }
  } else if (perim && bay) {
    put(x, 1, z, "smooth_quartz");                                       // window sill
    put(x, 2, z, "glass_pane", PANE[side]);
    put(x, 3, z, "glass_pane", PANE[side]);
  } else if (perim) {
    for (let y = 1; y <= 3; y++) put(x, y, z, "bricks");
  }

  // first-floor line: a dark fascia over the shopfront, a cream string course elsewhere, and a solid slab inside
  if (perim) put(x, 4, z, street ? "dark_oak_planks" : "smooth_quartz");
  else put(x, 4, z, "smooth_stone");

  // upper floor, y 5..7: brick piers, glass bays, a cream lintel course on top (also the wing's coping)
  if (roof >= 8) {
    if (perim) {
      for (let y = 5; y <= 6; y++) {
        if (bay) put(x, y, z, "glass_pane", PANE[side]);
        else put(x, y, z, "bricks");
      }
      put(x, 7, z, "smooth_quartz");
    }
  }

  // second ceiling / roof structure: a cream band on the walls, a solid slab inside
  if (roof >= 9) {
    if (perim) put(x, 8, z, "smooth_quartz");
    else put(x, 8, z, "smooth_stone");
  }

  // parapet and roof, y 9..10: brick parapet with a cream coping; flat roof surface and structure inside
  if (roof >= 11) {
    if (perim) {
      put(x, 9, z, "bricks");
      put(x, 10, z, "smooth_quartz");
    } else {
      put(x, 9, z, "stone");
      put(x, 10, z, "stone");                                              // a light roof membrane, not a dark pit inside the parapet
    }
  }
}

// warm light behind some glass: a lantern hung from the ground-floor slab behind a shopfront bay, glowstone on the
// first-floor floor behind an upper bay. Only cells just inside the bay, never on the wall itself.
for (const { x, z, side } of windows) {
  const d = SIDE[side];
  const ix = x - d[0], iz = z - d[1];
  if (!inFP(ix, iz) || isPerim(ix, iz)) continue;
  const along = side === "N" || side === "S" ? x : z;
  if (along % 4 === 1) put(ix, 5, iz, "glowstone");
  else if (side === "N" && along % 4 === 3) put(ix, 3, iz, "lantern", LANTERN_HANG);
}

// roof plant: a 2x2 stone-brick plant room on the flat roof, capped with a slab, and two AC units beside it
for (const x of [2, 3]) for (const z of [2, 3]) {
  put(x, 11, z, "stone_bricks");
  put(x, 12, z, "stone_bricks");
  put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
put(5, 11, 4, "iron_block");
put(4, 11, 5, "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170779.nbt");
console.log(`way_912170779: ${g.count()} blocks, ${g.palette.length - 1} palette entries, ${windows.length} bays`);
