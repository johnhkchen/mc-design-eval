// 59 West 46th Street, 1906 commercial and office building: a 5-storey brick loft with a limestone base, belt courses
// and a cornice, on a 6 x 14 footprint (x across the 46th Street frontage, low z = north = the street face). Lidar roof
// is 15-16 over the body (median 15, read as one flat tier at 16 with a parapet), and the west party wall rises to 18
// (lidar 18 along x 0). Ground is 0 everywhere, so there is no foundation to fill. Ground floor: granite bulkhead and
// clear shopfront glass with a central iron door under a dark fascia canopy. Upper storeys: a window band of glass
// with iron mullions between calcite quoins, storey belts at each floor line. East side: windows between calcite piers.
// West side: brick party wall with paired windows over a light court (the lot line is visible from the air).
// Rear: plain brick with windows. Roof: a stair bulkhead on the deck. The interior is
// air behind the glass with a floor slab per storey (no interiors); warm glowstone and shroomlight sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081124.cells.json`, "utf8"));
const X = 6, Y = 20, Z = 14;

// Panes and bars connect to their neighbours by state, or they stand as isolated posts.
const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // on a face along x
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // on a face along z
const FLOORS = [0, 3, 6, 9, 12, 15];   // the ground slab, then one floor line per storey; the top one is the roof deck
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([X, Y, Z]);
const edge = (x, z) => x === 0 || x === 5 || z === 0 || z === 13;

// 1. Floors and the parapet. Belts at each floor line (granite plinth, smooth stone belts, a calcite cornice on top).
// Floors are solid across the footprint, so each storey stands on the one below. The party wall (x 0) gets a calcite cap.
const beltAt = (y) => (y === 0 ? "polished_granite" : y === 15 ? "calcite" : "smooth_stone");
for (const [x, z] of cells) {
  for (const y of FLOORS) g.set(x, y, z, edge(x, z) ? beltAt(y) : "stone");
  if (edge(x, z)) {
    g.set(x, 16, z, "bricks");
    if (x === 0) g.set(x, 17, z, "calcite");
  }
}

// 2. Walls, one storey at a time. Storey y-bands: shopfront y 1-2, then windows at y 4-5, 7-8, 10-11 and 13-14.
for (const [x, z] of cells) {
  for (const y of [1, 2, 4, 5, 7, 8, 10, 11, 13, 14]) {
    if (!edge(x, z)) continue;
    const ground = y <= 2;
    if ((x === 5 || x === 0) && (z === 0 || z === 13)) { g.set(x, y, z, "calcite"); continue; }   // quoins
    if (x === 0) {                                                               // west party wall: brick, with paired windows over a light court
      if (!ground && z >= 2 && z <= 11 && (z - 2) % 4 < 2) { g.set(x, y, z, "glass_pane", ALONG_Z); continue; }
      g.set(x, y, z, "bricks"); continue;
    }
    if (z === 0) {                                                               // 46th Street frontage
      if (ground && x === 2) { g.set(x, y, z, "iron_door", { ...DOOR, half: y === 1 ? "lower" : "upper" }); continue; }
      if (ground && y === 1) { g.set(x, y, z, "polished_granite"); continue; }   // shopfront bulkhead
      if (x === 2 || x === 3) { g.set(x, y, z, "iron_bars", ALONG_X); continue; }   // mullions
      g.set(x, y, z, "glass_pane", ALONG_X); continue;
    }
    if (z === 13) {                                                              // rear, plain brick
      if (ground && y === 1) { g.set(x, y, z, "bricks"); continue; }
      g.set(x, y, z, "glass_pane", ALONG_X); continue;
    }
    if (x === 5) {                                                               // east side: piers at z 4, 8, 12
      if (z % 4 === 0) { g.set(x, y, z, "calcite"); continue; }
      g.set(x, y, z, "glass_pane", ALONG_Z); continue;
    }
  }
}

// 3. Entrance canopy: a dark fascia over the shopfront, on the storey line.
for (const x of [1, 2, 3, 4]) g.set(x, 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });

// 4. Roof bulkhead on the deck (stair and lift), a 2 x 3 brick box with a calcite cap.
for (let x = 2; x <= 3; x++) for (let z = 9; z <= 11; z++) {
  g.set(x, 16, z, "bricks"); g.set(x, 17, z, "bricks"); g.set(x, 18, z, "calcite");
}

// 5. Warm light behind some panes (in the air gap at z 1, beside the glass on the street face).
const lights = [
  [1, 2, 1, "glowstone"], [4, 2, 1, "glowstone"],
  [1, 4, 1, "glowstone"], [4, 7, 1, "glowstone"],
  [2, 10, 1, "shroomlight"], [4, 13, 1, "glowstone"],
  [1, 10, 3, "glowstone"], [1, 13, 7, "glowstone"],   // behind the party-wall windows, in the light court
];
for (const [x, y, z, b] of lights) g.set(x, y, z, b);

const out = g.save(`${DIR}/NYC1081124.nbt`);
console.log(`NYC1081124.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
