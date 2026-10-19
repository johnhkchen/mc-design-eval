// 595 Fifth Avenue (NYC 1035429), 1930: a seven-storey limestone office block with an eight-storey north-east tower.
// Limestone walls with granite base and cornice, smooth-stone storey bands, piers every third cell, steel-sash shopfronts
// on the ground floor, a double entrance under a dark canopy, and a mechanical penthouse on the main roof.
// Lidar roofs are median-smoothed on a 3x3 and snapped to the two tiers (21 and 24 blocks: seven and eight storeys).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035429.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 27, D = 6, H = 36;

const FOUND = "polished_granite", BAND = "smooth_quartz", PIER = "calcite", SLAB = "smooth_stone", DECK = "stone";
const GLASS = "light_blue_stained_glass_pane", FRAME = "iron_block", LAMP = "glowstone", LAMP2 = "shroomlight";
const CANOPY = "black_concrete", MECH = "stone_bricks";

const byKey = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = byKey.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

const g = new Voxels([W, H, D]);
const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
// Piers: on the long faces every third cell and at the corners; on the end faces only the corners. The rest is glazing.
const pier = (x, z) => (x === 0 || x === W - 1) ? (z === 0 || z === D - 1) : (z === 0 || z === D - 1) && (x % 3 === 0 || x === W - 1);
const door = (x, y, z, half, hinge) => g.set(x, y, z, "iron_door", { facing: "north", half, hinge, open: "false", powered: "false" });
const isEntrance = (x, z) => z === D - 1 && (x === 9 || x === 10);

const tier = new Map();
for (const [x, z, G] of cells) {
  const R = median(x, z) >= 23 ? 24 : 21;
  tier.set(R, (tier.get(R) || 0) + 1);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);

  if (!perim(x, z)) {
    // Interior: no rooms, only a floor slab per storey (on the ground, every storey line, and the roof deck).
    for (let y = G; y < R; y++) if (y === G || y % 3 === 0) g.set(x, y, z, SLAB);
    g.set(x, R, z, DECK);
    continue;
  }

  // Envelope: base course at grade, storey bands every 3 blocks, shopfronts in the ground storey, piers and glazing above.
  for (let y = G; y < R; y++) {
    if (isEntrance(x, z) && (y === G || y === G + 1)) continue;             // door halves, placed below
    if (y === G) g.set(x, y, z, FOUND);
    else if (y % 3 === 0) g.set(x, y, z, BAND);
    else if (pier(x, z)) g.set(x, y, z, y < 3 ? FRAME : PIER);
    else g.set(x, y, z, GLASS);
  }
  g.set(x, R, z, FOUND);                                                     // cornice
  g.set(x, R + 1, z, PIER);                                                  // parapet
}

// Lights: warm glass in some windows, one block behind the pane, on the interior air above each storey's slab.
for (const [x, z, G] of cells) {
  if (perim(x, z) || x === 0 || x === W - 1) continue;
  if (z !== 0 && z !== D - 1) continue;
  const R = median(x, z) >= 23 ? 24 : 21;
  const inner = z === 0 ? 1 : D - 2;
  for (let y = G + 1; y < R; y++) {
    if (y % 3 === 0) continue;                                               // storey bands are slabs
    if (y < 3) { if (y === 2 && x % 4 === 1) g.set(x, y, inner, LAMP); continue; }
    const storey = Math.floor(y / 3);
    if (y % 3 === 1 && (x * 5 + storey * 3 + (z === 0 ? 0 : 4)) % 11 === 0) g.set(x, y, inner, z === 0 ? LAMP : LAMP2);
  }
}

// Entrance: a double iron door on the south front, a dark canopy band over it.
for (let x = 8; x <= 11; x++) g.set(x, 3, D - 1, CANOPY);
for (const x of [9, 10]) {
  const G = byKey.get(`${x},${D - 1}`).g;
  const hinge = x === 9 ? "left" : "right";
  door(x, G, D - 1, "lower", hinge);
  door(x, G + 1, D - 1, "upper", hinge);
}

// Roof equipment on the main roof: a penthouse block over the interior, on the roof deck.
for (const [x, z] of cells) {
  if (perim(x, z) || x < 3 || x > 6 || z < 2 || z > 3) continue;
  if (median(x, z) >= 23) continue;
  g.set(x, 22, z, MECH); g.set(x, 23, z, MECH);
}

const counts = Object.fromEntries(tier);
const { blocks, palette } = g.save(`${dir}/NYC1035429.nbt`);
console.log(JSON.stringify({ tiers: counts, blocks, palette }));
