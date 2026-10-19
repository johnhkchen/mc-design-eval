// MetLife Building, East 42nd Street, a Midtown office block of 1963: a pale stone base on the street, white precast piers
// and blue-green curtain glass between grey spandrels, built as a 33-block lower wing on the street (north) front and a
// 40-block tower on the south-east half, with a 42-block mechanical crown set in its north-east corner. The north face (z 0)
// is the 42nd Street front: a shopfront band with a double entrance under a stone lintel, and transit ventilation grilles
// at the ground. The lidar roof is smoothed into those three flat tiers; the lidar's zero cells are no-data, not roofs.
// Inside is air behind the glass with a floor slab per storey; a few offices glow warm behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1085630.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 12, Z = 34, Y = 54;
const key = (x, z) => `${x},${z}`;

// Per cell: ground (foundation top) and the lidar roof, with zeros treated as no-data.
const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roofRaw.set(key(x, z), r); }

// Smooth the lidar: the median of the valid roofs in the 3x3 around each cell, then snap to three flat tiers.
const median = (vals) => { vals.sort((a, b) => a - b); return vals[Math.floor(vals.length / 2)]; };
const smoothed = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = roofRaw.get(key(x + dx, z + dz)); if (r > 0) vals.push(r);
  }
  return median(vals);
};
const tierOf = (x, z) => { const s = smoothed(x, z); return s >= 41 ? 42 : s >= 37 ? 40 : 33; };
const T = new Map();                                                    // absolute top of each cell's massing (exclusive)
for (const [x, z] of [...roofRaw.keys()].map((k) => k.split(",").map(Number))) T.set(key(x, z), tierOf(x, z));

const top = (x, z) => T.get(key(x, z)) ?? 0;
const gr = (x, z) => ground.get(key(x, z)) ?? 0;
const occ = (x, z, y) => x >= 0 && x < X && z >= 0 && z < Z && y < top(x, z);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !occ(x + dx, z + dz, y); });

// Materials: a pale stone base, white precast piers, grey spandrels, blue-green tinted glass, a light shopfront on the street.
const BASE = "smooth_quartz", CORNICE = "polished_andesite", PIER = "white_concrete", SPANDREL = "light_gray_concrete";
const FLOOR = "light_gray_concrete", ROOF = "gray_concrete", GLASS = "cyan_stained_glass_pane", SHOP = "light_blue_stained_glass_pane";
const GRILLE = "iron_bars", MECH = "iron_block";
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false" };   // a pane run along an x-facing wall
const PANE_ALONG_X = { north: "false", south: "false", east: "true", west: "true" };   // a pane run along a z-facing wall
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;                          // a few offices warm, scattered

const g = new Voxels([X, Y, Z]);
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cellList) {
  const t = top(x, z), base = gr(x, z);
  // Foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope.
  for (let y = 0; y < base; y++) g.set(x, y, z, BASE);
  for (let y = base; y < t; y++) {
    const ex = exposed(x, z, y), shell = ex.length > 0, top1 = y === t - 1;
    if (!shell) {                                                   // inside: a floor slab per storey and a roof deck, air between
      if (top1) g.set(x, y, z, ROOF);
      else if (y % 3 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (top1) { g.set(x, y, z, CORNICE); continue; }                // parapet cornice on the exposed edge
    if (y <= 1) { g.set(x, y, z, BASE); continue; }                 // granite-look base course on the street
    if (y % 3 === 0) { g.set(x, y, z, SPANDREL); continue; }        // grey spandrel at each storey line
    const xFace = ex.includes("W") || ex.includes("E");            // the wall runs along z here
    const pier = xFace ? z % 3 === 0 || z === Z - 1 : x % 3 === 0 || x === X - 1;
    if (pier) { g.set(x, y, z, PIER); continue; }
    if (y < 3) { g.set(x, y, z, SHOP, xFace ? PANE_ALONG_Z : PANE_ALONG_X); continue; }   // the shopfront band
    g.set(x, y, z, GLASS, xFace ? PANE_ALONG_Z : PANE_ALONG_X);
  }
}

// Warm offices: glowstone just inside the glass, on scattered bays above the shopfront, only where the inside is air.
for (const [x, z] of cellList) {
  const t = top(x, z);
  for (let y = 4; y < t - 1; y++) {
    if (y % 3 === 0) continue;                                      // glass rows only, not the spandrels
    const ex = exposed(x, z, y);
    if (!ex.length || !lit(x, y, z)) continue;
    const [dx, dz] = DIRS[ex[0]];
    const ix = x - dx, iz = z - dz;                                 // the cell inside the glass
    if (exposed(ix, iz, y).length === 0 && y >= gr(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// The double entrance on the street face (z 0), under a stone lintel, with transit ventilation grilles at the ground.
for (const x of [5, 6]) {
  g.set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: x === 5 ? "left" : "right", open: "false", powered: "false" });
}
for (let x = 4; x <= 7; x++) g.set(x, 3, 0, CORNICE);
for (const x of [9, 10]) g.set(x, 2, 0, GRILLE);

// Rooftop plant: a few units on the wing and tower roofs, and a mechanical crown with a lightning-rod mast.
for (const [x, z] of [[3, 4], [8, 4], [3, 8], [9, 8]]) {
  if (top(x, z) === 33 && exposed(x, z, 32).length === 0) g.set(x, 33, z, MECH);
}
for (const [x, z] of [[8, 20], [10, 26]]) {
  if (top(x, z) === 40 && exposed(x, z, 39).length === 0) g.set(x, 40, z, MECH);
}
const crown = cellList.filter(([x, z]) => top(x, z) === 42 && exposed(x, z, 41).length === 0);
if (crown.length) {
  const [mx, mz] = crown[Math.floor(crown.length / 2)];
  for (let y = 42; y <= 45; y++) g.set(mx, y, mz, GRILLE);
  g.set(mx, 46, mz, "lightning_rod", { facing: "up", powered: "false" });
  for (const [x, z] of crown) if ((x + 2 * z) % 3 === 0 && (x !== mx || z !== mz)) g.set(x, 42, z, MECH);
}

const { blocks, palette } = g.save(`${DIR}/NYC1085630.nbt`);
console.log(`NYC1085630.nbt: ${blocks} blocks, ${palette} palette entries`);
