// Wellesley Apartments (way 293020891): a 1980s concrete-frame apartment block, 12 storeys of 4 blocks on a
// datum of y 5 (the ground floor's slab), a stepped crown and a lift overrun. Massing from the lidar roof, median-
// smoothed over 5x5 and quantised to whole storeys; facades are a 1-block shell (piers, glazed bays, string courses,
// a parapet) with an air gap behind the glass and a slab per storey. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(HERE + "way_293020891.cells.json", "utf8"));   // [x, z, ground, roof]

const W = 66, H = 70, D = 55;
const DATUM = 5, STOREY = 4;
const PLINTH = "stone_bricks", SLAB = "light_gray_concrete", TRIM = "white_concrete", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone";

const key = (x, z) => `${x},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };   // N is -z, the south-facing side is +z

// the lidar roof per footprint cell
const roofRaw = new Map();
for (const [x, z, , r] of cells) roofRaw.set(key(x, z), r);

// clean tiers: the median roof over a 5x5 window of footprint cells, rounded to whole storeys above the datum
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const tier = new Map();   // key -> storeys n; the tier's roof row is DATUM + STOREY * n
for (const [k] of roofRaw) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const v = roofRaw.get(key(x + dx, z + dz)); if (v !== undefined) near.push(v); }
  tier.set(k, Math.max(1, Math.round((median(near) - DATUM) / STOREY)));
}
const topOf = (k) => DATUM + STOREY * tier.get(k);

// the sides of a cell that face outside: off the footprint, or down a tier (a setback's exposed face)
const sidesOf = new Map();
for (const [k] of roofRaw) {
  const [x, z] = k.split(",").map(Number), out = [];
  for (const [s, [dx, dz]] of Object.entries(DIRS)) {
    const n = key(x + dx, z + dz);
    if (!roofRaw.has(n) || tier.get(n) < tier.get(k)) out.push(s);
  }
  sidesOf.set(k, out);
}
const isOuter = (k) => sidesOf.get(k).length > 0;
const isInterior = (k) => roofRaw.has(k) && !isOuter(k);

// the entrance: a three-bay run on the north (-z) facade near the middle of its length
const northOnly = [...roofRaw.keys()].filter((k) => { const s = sidesOf.get(k); return s.includes("N") && !s.includes("E") && !s.includes("W"); })
  .map((k) => ({ k, x: Number(k.split(",")[0]), z: Number(k.split(",")[1]) })).sort((a, b) => a.x - b.x);
const entranceCell = northOnly[Math.floor(northOnly.length / 2)];
const entrance = new Map();   // key -> true for the three bays
if (entranceCell) for (const e of northOnly) if (Math.abs(e.x - entranceCell.x) <= 1) entrance.set(e.k, true);

const g = new Voxels([W, H, D]);

// the shell and the slabs, cell by cell: plinth to the datum under every cell, a slab per storey, facades on the
// outer cells, air behind the glass, a roof membrane and a parapet on the outer cells of each tier
for (const [k, n] of tier) {
  const [x, z] = k.split(",").map(Number), outer = isOuter(k), sides = sidesOf.get(k), top = topOf(k);
  const alongZ = sides.some((s) => s === "E" || s === "W"), alongX = sides.some((s) => s === "N" || s === "S");
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, PLINTH);
  for (let kk = 0; kk < n; kk++) {
    const b = DATUM + STOREY * kk, last = kk === n - 1;
    g.set(x, b, z, outer && kk === 0 ? PLINTH : SLAB);                        // base course, then storey slab
    if (outer) {
      for (const y of [b + 1, b + 2]) {                                       // glazed bays between piers
        let block = TRIM, state;
        const pier = !entrance.has(k) && ((alongZ && alongX) || (alongZ && z % 3 === 0) || (alongX && !alongZ && x % 3 === 0));
        if (!pier) {
          block = GLASS;
          state = alongZ && !alongX ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
        }
        g.set(x, y, z, block, state);
      }
      g.set(x, b + 3, z, TRIM);                                                // lintel (or cornice on the top storey)
    } else if (last) g.set(x, b + 3, z, ROOF);                                 // interior: the roof membrane
  }
  if (outer) g.set(x, top, z, TRIM);                                           // parapet
}

// doors: the iron door's upper half and its hinge side, set on the entrance's centre bay
if (entranceCell) {
  const { x, z } = entranceCell, b = DATUM;
  g.set(x, b + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, b + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // a lantern each side of the door, standing inside the lobby behind the shopfront glass
  for (const dx of [-1, 1]) g.set(x + dx, b + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm lights behind some upper-storey windows: glowstone in the air gap, one bay in nine
for (const [k, n] of tier) {
  const [x, z] = k.split(",").map(Number), sides = sidesOf.get(k);
  if (!sides.length) continue;
  for (let kk = 1; kk < n - 1; kk++) {
    const b = DATUM + STOREY * kk;
    if ((x * 7 + z * 13 + kk * 5) % 9 !== 0) continue;
    const s = sides[0], [dx, dz] = DIRS[s], inward = key(x - dx, z - dz);
    if (isInterior(inward)) g.set(x - dx, b + 1, z - dz, LIGHT);   // stands on the storey slab, not in the air
  }
}

// roof plant: a few 3x2 boxes on the flat roofs, two cells in from the edge, all on the same tier
const occupied = new Set();
const plantSpots = [];
for (const [k, n] of tier) {
  if (topOf(k) < 45) continue;
  const [x, z] = k.split(",").map(Number);
  if ((x * 5 + z * 3) % 17 !== 0) continue;
  const cellsIn = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) cellsIn.push(key(x + dx, z + dz));
  if (cellsIn.every((c) => roofRaw.has(c) && tier.get(c) === n && !isOuter(c) && !occupied.has(c))) {
    plantSpots.push({ x, z, top: topOf(k) });
    cellsIn.forEach((c) => occupied.add(c));
  }
}
for (const p of plantSpots) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) for (let dy = 0; dy < 2; dy++) g.set(p.x + dx, p.top + dy, p.z + dz, SLAB);

// the lift overrun on the tallest tier: a 4x4 box, three high, nearest the tower's centre
const tall = [...tier].filter(([, n]) => n === Math.max(...tier.values())).map(([k]) => k.split(",").map(Number));
if (tall.length) {
  const cx = tall.reduce((s, p) => s + p[0], 0) / tall.length, cz = tall.reduce((s, p) => s + p[1], 0) / tall.length;
  let best = null;
  for (const [x, z] of tall) {
    const box = [];
    for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) box.push(key(x + dx, z + dz));
    if (!box.every((c) => roofRaw.has(c) && tier.get(c) === tier.get(key(x, z)) && sidesOf.get(c).length === 0)) continue;
    const d = (x + 2 - cx) ** 2 + (z + 2 - cz) ** 2;
    if (!best || d < best.d) best = { x, z, d, top: topOf(key(x, z)) };
  }
  if (best) for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 3; dy++)
    g.set(best.x + dx, best.top + dy, best.z + dz, dy === 2 ? TRIM : SLAB);
}

const counts = g.save(HERE + "way_293020891.nbt");
console.log(`way_293020891: ${counts.blocks} blocks, ${counts.palette} palette entries, ${tier.size} footprint cells`);
