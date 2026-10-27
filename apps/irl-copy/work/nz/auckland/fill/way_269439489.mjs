// way 269439489: a 1930s Auckland brick commercial block, two storeys over a stone base, on a slope that falls
// away to the south. Brick walls with quartz piers and string courses, a cream-render wing to the south-west,
// a dark canopied entrance at grade on the uphill (north) face, flat roofs with a cornice and roof plant.
// Tiers come from the lidar roof: cells at 8+ are the main block (top 9), the rest the lower wing (top 6).
// Floors are level (slab at y 5 across the main block); the downhill side shows its extra storey below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439489.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439489.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const X = 29, Y = 21, Z = 33;
const K = (x, z) => `${x},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: "S", S: "N", E: "W", W: "E" };   // the face's opposite: the way into the building

// Smoothed tiers: lidar roofs of 8-9 are the main block (top surface 9); everything lower is the wing (top 6).
const ground = new Map(), tier = new Map();
for (const [x, z, g, r] of cells) {
  ground.set(K(x, z), g);
  tier.set(K(x, z), r >= 8 ? "main" : "wing");
}
const inF = (x, z) => ground.has(K(x, z));
const TOP = { main: 9, wing: 6 };

// Outward faces of a footprint cell, and whether it is on the perimeter.
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Vertical plan (block y indices, solid below the top surface): slab at 5 (main floor level), 6-7 upper glass storey,
// 8 cornice/roof. Basement (downhill) rows run from the cell's ground up to 4. Wing: base, glazed band, cornice at 5.
const FLOOR = 5, CORNICE = { main: 8, wing: 5 };

// Piers: a perimeter cell at a multiple-of-3 position along its face (x on N/S faces, z on E/W faces) is a pier.
const alongOf = (x, z, outs) => (outs.includes("N") || outs.includes("S") ? x : z);
const isPier = (x, z, outs) => outs.length >= 2 || alongOf(x, z, outs) % 3 === 0;

// Glass pane connected along its wall face (so adjacent panes join into a continuous ribbon of windows).
const paneState = (outs) => {
  const xFace = outs.includes("N") || outs.includes("S");
  return xFace ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Entrance: the middle of the north run of the main block, on grade (ground 5).
const DOOR = [20, 0];
const LIGHT_WINDOWS = new Set();   // windows with a glowstone just inside (set below)

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// The window pane glass per face, with a glowstone just inside every fourth window of the upper storey.
let winCount = 0;
for (const [x, z, gr, roof] of cells) {
  const t = tier.get(K(x, z));
  const outs = outsOf(x, z);
  const perim = outs.length > 0;
  const top = TOP[t];

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (t === "main") {
    // Downhill basement: from the ground up to the floor line, solid inside, windowed on the perimeter.
    for (let y = gr; y < FLOOR; y++) {
      if (!perim) { put(x, y, z, "stone_bricks"); continue; }
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }                     // base course
      const win = !isPier(x, z, outs) && y <= gr + 2;
      if (win) put(x, y, z, "glass_pane", paneState(outs));
      else put(x, y, z, "stone_bricks");
    }
    // Floor slab at y 5, the string course on the perimeter.
    put(x, FLOOR, z, perim ? "smooth_quartz" : "smooth_stone");
    // Upper storey: air behind the glass inside, piers and glazing on the walls, cornice on top.
    if (!perim) {
      put(x, CORNICE.main, z, "smooth_stone");                                    // roof slab
    } else {
      for (let y = FLOOR + 1; y < CORNICE.main; y++) {
        const win = !isPier(x, z, outs);
        if (win) {
          put(x, y, z, "glass_pane", paneState(outs));
          if (y === FLOOR + 1) winCount++;
          // A warm light just inside, in every fourth window, on the lower row of the upper storey.
          if (y === FLOOR + 1 && winCount % 4 === 0) {
            const [dx, dz] = DIRS[INWARD[outs[0]]];
            if (inF(x + dx, z + dz)) { put(x + dx, y, z + dz, "glowstone"); LIGHT_WINDOWS.add(K(x, z)); }
          }
        } else {
          put(x, y, z, "bricks");                                                 // brick piers between the glazed bays
        }
      }
      put(x, CORNICE.main, z, "smooth_quartz");                                   // cornice
    }
  } else {
    // Lower wing: base course on grade, then a glazed band with piers, cornice at 5 over the roof.
    if (perim) {
      put(x, gr, z, "stone_bricks");
      for (let y = gr + 1; y < CORNICE.wing; y++) {
        if (isPier(x, z, outs)) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", paneState(outs));
      }
      put(x, CORNICE.wing, z, "smooth_quartz");
    } else {
      put(x, CORNICE.wing, z, "smooth_stone");                                    // roof slab over air
    }
  }
}

// Entrance: a door on the uphill face of the main block, lit either side, under a dark canopy.
{
  const [ex, ez] = DOOR;
  const facing = "north";
  put(ex, FLOOR, ez, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, FLOOR + 1, ez, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) put(ex + dx, 7, ez, "dark_oak_slab", { type: "top", waterlogged: "false" });
  for (const dx of [-1, 1]) put(ex + dx, FLOOR + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a few iron boxes on the main roof, on the interior, over the solid roof slab.
const plant = [];
const mainInterior = (x, z) => inF(x, z) && tier.get(K(x, z)) === "main" && !outsOf(x, z).length;
for (const [x, z] of cells) {
  if (x % 7 === 3 && z % 7 === 3 && mainInterior(x, z) && mainInterior(x + 1, z) && mainInterior(x, z + 1) && mainInterior(x + 1, z + 1)) plant.push([x, z]);
}
for (const [px, pz] of plant) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(px + dx, 9, pz + dz, "iron_block");

const stats = g.save(OUT);
console.log(`way 269439489: ${stats.blocks} blocks, palette ${stats.palette}, windows ${winCount}, lit ${LIGHT_WINDOWS.size}, plant ${plant.length}`);
