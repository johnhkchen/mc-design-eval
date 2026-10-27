// Way 162154130: a three-storey Edwardian brick shop-and-flat block (c.1910s, Mt Eden Road type), its footprint a
// 1-2 cell diagonal strip that climbs 2 blocks along its length and steps down to a two-storey wing at the south end.
// Brick walls on stone foundations, a stone string course per floor, a shopfront with a timber fascia, glass bays
// alternating with cream terracotta piers, a cornice and parapet, and warm lights in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_162154130.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([14, 27, 34]);

const WALL = "bricks", FOUND = "stone_bricks", STRING = "smooth_stone", PIER = "white_terracotta";
const FASCIA = "dark_oak_planks", GLASS = "glass_pane", LIGHT = "glowstone";

// The lidar roof, smoothed to two flat tiers: the three-storey block (14) and the two-storey wing at the south end (11).
const tier = (roof) => (roof >= 13 ? 14 : 11);

// The door and its hood lantern sit on the ground-floor bay of the lowest street-level cell that has a foundation under it.
const DOOR_K = 20;
const ROOF_PLANT_K = [12, 30];

// The strip is one to two cells wide, so every footprint cell is envelope: no room behind a pane is solid except the
// neighbouring wall, and the floors are the string courses. Bays alternate along the strip (k even = glass, odd = pier).
cells.forEach(([x, z, ground, roofRaw], k) => {
  const roof = tier(roofRaw), end = k === 0 || k === cells.length - 1;
  const wall = end ? FOUND : WALL;                       // quoins at the two ends of the strip
  const glassBay = k % 2 === 0;

  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);          // foundation: solid under every cell, nothing floats

  for (let y = ground; y < roof; y++) {
    let b = wall, st;
    if (y >= roof - 1) b = FOUND;                                 // parapet cap
    else if (y === roof - 2) b = STRING;                          // cornice
    else if (y === ground) b = FOUND;                             // base course
    else if (y < 4) {                                             // ground storey: shopfront
      if (y === 3) b = FASCIA;
      else if (glassBay) b = GLASS;
      else b = PIER;
    } else if (y === 4 || y === 8) b = STRING;                    // floor lines
    else if (y === 7 || y === 11) b = wall;                       // lintel courses under each floor
    else {                                                        // upper windows: 2-high panes in each glass bay
      if (glassBay) b = GLASS;
      else b = PIER;
    }

    // Warm lights: some upper panes and shop panes glow behind the glass, deterministic and spread along the strip.
    if (glassBay && b === GLASS && (y === 5 || y === 9 || y < 4) && (k * 5 + y * 3) % 7 === 0) b = LIGHT;

    if (k === DOOR_K) {
      if (y === ground) { b = "dark_oak_door"; st = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (y === ground + 1) { b = "dark_oak_door"; st = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (y === 3) { b = "lantern"; st = { hanging: "true", waterlogged: "false" }; }   // hood lantern under the string course
    }
    g.set(x, y, z, b, st);
  }

  if (ROOF_PLANT_K.includes(k) && roof === 14) g.set(x, roof, z, "iron_block");   // roof plant on the three-storey roof
});

const out = `${HERE}/way_162154130.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ file: out, ...info }));
