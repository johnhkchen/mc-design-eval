// 611 Fifth Avenue, Saks Fifth Avenue: a 1924 NYC individual landmark, commercial and office, 57 x 56 blocks. Read as a
// 1920s limestone setback block: a granite base (plinth, a belt course, shop windows between granite piers), then pale
// limestone piers with a smooth-quartz spandrel band at every third row (2 panes + 1 band = a 3-block storey), a
// smooth-quartz cornice and a calcite parapet on each roof edge, and a mechanical penthouse with a verdigris cap on
// the taller tiers. The lidar roof is smoothed into tiers (36, 44, 48, 53, 58, 61) by a majority filter, so each
// column stands from its own ground to its tier; setbacks come out where a taller column meets a lower roof. Lidar
// cells under 4 blocks that touch the footprint edge are open courts (paved at ground); interior gaps take their
// neighbours' tier. The Fifth Avenue frontage is taken to be the x = 0 face (the long frontage), with the main door
// on it under a dark transom and canopy. Glass sits in the outer layer with air behind it and a floor slab per
// storey (no interiors); a few panes are lit with glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081145.cells.json`, "utf8"));
const X = 57, Z = 56, Y = 66;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));
const N4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// 1. Open courts: low lidar cells joined to the footprint's edge (the 0s and 1s along the east and north edges).
const court = new Set();
const todo = [];
for (const [k, { roof }] of cell) {
  if (roof >= 4) continue;
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !inFoot(x + dx, z + dz))) { court.add(k); todo.push([x, z]); }
}
while (todo.length) {
  const [x, z] = todo.pop();
  for (const [dx, dz] of N4) {
    const nk = key(x + dx, z + dz);
    if (!cell.has(nk) || court.has(nk) || cell.get(nk).roof >= 4) continue;
    court.add(nk); todo.push([x + dx, z + dz]);
  }
}

// 2. Tiers: the lidar roof snapped to six levels, then a majority filter over the 3 x 3 neighbourhood (the cell's own
// vote counts double) to make clean flat tiers. Interior low cells take the neighbours' tier.
const TIERS = [36, 44, 48, 53, 58, 61];
const nearest = (r) => TIERS.reduce((b, t) => (Math.abs(t - r) < Math.abs(b - r) ? t : b));
let lab = new Map();
for (const [k, { roof }] of cell) if (!court.has(k) && roof >= 4) lab.set(k, nearest(roof));
for (let pass = 0; pass < 3; pass++) {
  const next = new Map();
  for (const [k] of cell) {
    if (court.has(k)) continue;
    const [x, z] = k.split(",").map(Number);
    const votes = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const v = lab.get(key(x + dx, z + dz)); if (v === undefined) continue;
      const w = dx === 0 && dz === 0 ? 2 : 1;
      votes.set(v, (votes.get(v) || 0) + w);
    }
    if (votes.size) next.set(k, [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]);
  }
  lab = next;
}

const groundOf = (x, z) => cell.get(key(x, z)).ground;
// Top of each column as an exclusive bound: a court's top is its paving (ground + 1); outside the footprint is 0.
const topOf = (x, z) => {
  if (!inFoot(x, z)) return 0;
  const k = key(x, z);
  return court.has(k) ? groundOf(x, z) + 1 : (lab.get(k) ?? 36);
};
// A neighbour is open at height y when it is off the footprint or its top is at or below y.
const open = (x, y, z) => !inFoot(x, z) || y >= topOf(x, z);

// Palette: limestone piers and spandrels, granite base, glass panes, dark marquee.
const PIER = "calcite", SPAND = "smooth_quartz", BASE = "polished_granite", CORE = "stone_bricks";
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // face on a z-normal wall: pane runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // face on an x-normal wall: pane runs along z
const lit = (u, y) => (u * 5 + y * 7) % 23 === 0;   // sparse, deterministic warm panes

// Main door: the middle of the x = 0 frontage, z 25..29 (bay: granite, pane, door, pane, granite).
const DOOR_Z = 27;

const g = new Voxels([X, Y, Z]);
for (const [k, { ground: G }] of cell) {
  const [x, z] = k.split(",").map(Number);

  // Courts: a stone fill to the paving, the paving at ground level.
  if (court.has(k)) {
    for (let y = 0; y < G; y++) g.set(x, y, z, CORE);
    g.set(x, G, z, "smooth_stone");
    continue;
  }

  const T = topOf(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, CORE);   // foundation from y 0 up to this cell's ground

  const perimeterTop = N4.some(([dx, dz]) => topOf(x + dx, z + dz) < T);
  for (let y = G; y < T; y++) {
    const faces = FACES.filter(([, dx, dz]) => open(x + dx, y, z + dz));

    // Interior: floor slab at each storey line and at the ground, roof cover on top, air between (no interiors).
    if (!faces.length) {
      if (y === G || y % 3 === 0) g.set(x, y, z, "smooth_stone");
      if (y === T - 1) g.set(x, y, z, "gray_concrete");
      continue;
    }

    const [, dx, dz] = faces[0];
    const corner = faces.length > 1;
    const u = dx !== 0 ? z : x;                       // position along the face
    const pane = dx !== 0 ? PANE_EW : PANE_NS;
    const onDoorFace = dx === -1 && faces.some(([n]) => n === "W");
    const doorBay = onDoorFace && z >= DOOR_Z - 2 && z <= DOOR_Z + 2;

    // Entrance: a door in the middle of the bay, flanking glass, granite piers, a dark transom and canopy above.
    if (doorBay && y <= 4) {
      if (z === DOOR_Z && (y === 1 || y === 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 3) {
        if (Math.abs(z - DOOR_Z) === 2) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else g.set(x, y, z, "black_concrete");
        continue;
      }
      if (y === 4) { g.set(x, y, z, "black_concrete"); continue; }
      if (y === 1 || y === 2) {
        if (Math.abs(z - DOOR_Z) === 2) g.set(x, y, z, BASE);
        else g.set(x, y, z, "light_blue_stained_glass_pane", pane);
        continue;
      }
    }

    let block;
    if (y === G || y === 3) block = BASE;                     // plinth course and the belt above the shops
    else if (y <= 2) block = corner || u % 3 === 0 ? BASE : "light_blue_stained_glass_pane";
    else if (y === T - 1) block = SPAND;                       // cornice course on each roof edge
    else if (y % 3 === 0) block = corner ? PIER : SPAND;       // spandrel band at every storey line
    else block = corner || u % 3 === 0 ? PIER : "light_blue_stained_glass_pane";

    if (block === "light_blue_stained_glass_pane") {
      if (lit(u, y)) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, block, pane);
    } else {
      g.set(x, y, z, block);
    }
  }

  // Parapet: a calcite rim on each roof edge that is lower than this column's top, and the roof is closed inside it.
  if (perimeterTop) g.set(x, T, z, PIER);

  // Mechanical penthouse on the taller tiers: a granite box with a verdigris cap, set well inside the roof.
  if (!perimeterTop && T >= 53 && x % 8 === 4 && z % 8 === 4) {
    g.set(x, T, z, BASE);
    g.set(x, T + 1, z, BASE);
    g.set(x, T + 2, z, "oxidized_copper");
  }
}

const info = g.save(`${DIR}/NYC1081145.nbt`);
console.log(JSON.stringify({ size: g.size, ...info }));
