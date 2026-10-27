// Way 912170776: a three-storey Interwar commercial block on the Mt Eden side of the CBD, 6 x 9 on its footprint.
// Plastered street front (white render, quartz trim, volcanic polished-andesite plinth), a shopfront with a centre
// door on the street (east) face, glass panes in framed bays, air gaps behind the glass with a few lights, a cornice
// and coping, and a copper HVAC box on the flat roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_912170776.cells.json`, "utf8"));

// [x, z, ground, roof] per footprint cell. The lidar roof is 11 or 12 blocks: one block of noise, so one flat roof at the median.
const ground = new Map(), roofs = [];
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roofs.push(r); }
const has = (x, z) => ground.has(`${x},${z}`);
const ROOF = roofs.sort((a, b) => a - b)[roofs.length >> 1];

// Materials: plaster walls, quartz trim, andesite plinth, dark fascia over the shops, copper plant, warm lights.
const WALL = "white_concrete", TRIM = "smooth_quartz", BASE = "polished_andesite", PIER = "quartz_pillar";
const DECK = "smooth_stone", FASCIA = "dark_oak_planks", PANE = "glass_pane", SHOP = "glass", PLANT = "oxidized_copper";
const PANE_STATE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Storeys: plinth at y 0, glass in rows 1-2 / 5-6 / 9-10, heads at 3 / 7 and belts at 4 / 8, cornice at ROOF - 1.
const HEADS = [3, 7], BELTS = [4, 8];
const GROUND_ROWS = [1, 2], UPPER_ROWS = [5, 6, 9, 10];

// Openings by face cell and row band. Street = east face (x = 5): shopfront on the ground floor with the door at z = 5,
// three bays above. The west face (x = 1) gets two bays a storey. Everything else stays plaster.
const groundOpen = new Map([["5,4", "shop"], ["5,5", "door"], ["5,6", "shop"], ["1,4", "pane"], ["1,6", "pane"]]);
const upperOpen = new Map([["5,4", "pane"], ["5,5", "pane"], ["5,6", "pane"], ["1,4", "pane"], ["1,6", "pane"]]);
const openingAt = (x, z, y) => (GROUND_ROWS.includes(y) ? groundOpen : UPPER_ROWS.includes(y) ? upperOpen : null)?.get(`${x},${z}`);

// The air gap behind each bay: the interior cell one step in (east bays look in to x = 4, west bays to x = 2).
const airBehind = new Set();
for (const [map] of [[groundOpen], [upperOpen]]) for (const key of map.keys()) {
  const [x, z] = key.split(",").map(Number);
  const px = x === 5 ? 4 : 2;
  airBehind.add(`${px},${z}`);
}
const gapRows = (x, z, y) => airBehind.has(`${x},${z}`) && (GROUND_ROWS.includes(y) || UPPER_ROWS.includes(y));

// Lights behind some glass: lanterns on the ground-storey and second-storey air gaps, glowstone and a shroomlight higher up.
const LANTERN = { hanging: "false", waterlogged: "false" };
const LIGHTS = [[4, 1, 4, "lantern", LANTERN], [4, 1, 6, "lantern", LANTERN], [4, 5, 5, "lantern", LANTERN],
  [2, 9, 4, "glowstone"], [4, 9, 6, "shroomlight"]];

const g = new Voxels([6, 24, 9]);
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)].filter(Boolean).length;
  const shell = faces > 0, corner = faces >= 2;
  for (let y = 0; y < ROOF; y++) {
    // Foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope.
    if (y < gr) { g.set(x, y, z, BASE); continue; }
    if (!shell) {
      if (y === ROOF - 1) g.set(x, y, z, DECK);
      else if (gapRows(x, z, y)) continue;                // air gap behind the glass (lights are placed below)
      else g.set(x, y, z, WALL);
      continue;
    }
    const opening = openingAt(x, z, y);
    if (y === 0) g.set(x, y, z, BASE);
    else if (y === ROOF - 1) g.set(x, y, z, TRIM);
    else if (opening === "door" && y === 1) g.set(x, y, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
    else if (opening === "door" && y === 2) g.set(x, y, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    else if (opening === "shop") g.set(x, y, z, SHOP);
    else if (opening === "pane") g.set(x, y, z, PANE, PANE_STATE);
    else if (y === 3 && (openingAt(x, z, 1) === "shop" || openingAt(x, z, 1) === "door")) g.set(x, y, z, FASCIA);
    else if (HEADS.includes(y) || BELTS.includes(y)) g.set(x, y, z, TRIM);
    else if (corner) g.set(x, y, z, PIER, { axis: "y" });
    else g.set(x, y, z, WALL);
  }
  // Coping: a bottom slab on the parapet's top course.
  if (shell) g.set(x, ROOF, z, `${TRIM}_slab`, { type: "bottom", waterlogged: "false" });
}
for (const [x, y, z, b, s] of LIGHTS) g.set(x, y, z, b, s);
// Copper HVAC box on the roof, a 2 x 2 unit set in from the parapet.
for (const [x, z] of [[2, 3], [3, 3], [2, 4], [3, 4]]) g.set(x, ROOF, z, PLANT);

const { blocks, palette } = g.save(`${dir}/way_912170776.nbt`);
console.log(`way_912170776: ${blocks} blocks, ${palette} palette entries, roof ${ROOF}`);
