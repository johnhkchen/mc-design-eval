// 500 Madison Avenue (1926, commercial and office): a setback office block of the 1916-zoning era. Granite base with
// shopfronts, sandstone storeys with glass bays between piers, a cornice on each setback, a small penthouse on the top tier.
// Shell only: the facade and each storey's floor slab, the rest of each tier is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081152.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const N = 20;
const LOW = 8;                                 // a roof under this is no building
const PLATEAUS = [6, 33, 39, 45, 48, 51];      // tiers snapped to storey lines (multiples of 3, roof row always 3k+2)

const id = (x, z) => x * N + z;
const raw = new Map(cells.map(([x, z, g, r]) => [id(x, z), { g, r }]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < N && z < N && raw.has(id(x, z));
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const NB4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const snap = (h) => PLATEAUS.reduce((best, p) => (Math.abs(p - h) < Math.abs(best - h) ? p : best));

// 1. Lidar cleanup. A low cell among low cells is a one-storey wing (the south-west strip); a lone low cell is a hole
//    in the scan (the east edge, the roof-0 cells), filled from its solid neighbours.
const lowN = (x, z) => NB8.filter(([dx, dz]) => inFoot(x + dx, z + dz)).map(([dx, dz]) => raw.get(id(x + dx, z + dz)).r);
const wing = new Set();
for (const [x, z, , r] of cells) {
  if (r >= LOW) continue;
  const ns = lowN(x, z);
  if (ns.filter((v) => v < LOW).length * 2 >= ns.length) wing.add(id(x, z));
}
const top = new Map();
for (const [x, z, , r] of cells) {
  let h = r;
  if (wing.has(id(x, z))) h = 4;
  else if (r < LOW) {
    const solid = NB8.filter(([dx, dz]) => inFoot(x + dx, z + dz))
      .map(([dx, dz]) => [x + dx, z + dz])
      .filter(([a, b]) => raw.get(id(a, b)).r >= LOW && !wing.has(id(a, b)))
      .map(([a, b]) => raw.get(id(a, b)).r);
    h = median(solid);
  }
  top.set(id(x, z), snap(h));
}
const T = (x, z) => top.get(id(x, z));           // absolute top of the tier (air from here up)
const G = (x, z) => raw.get(id(x, z)).g;         // ground at the cell (0 or 1 here)

// Sides of the cell at height y that face air: off the footprint, or above the neighbour's roof (a setback).
const airSides = (x, y, z) => NB4.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) <= y);

// 2. Massing and articulation, cell by cell, bottom up.
const g = new Voxels([N, 64, N]);
const doorZ = [9, 10];                           // the Madison Avenue entrance, on the east face (x = 19)
let lights = 0;
for (const [x, z] of cells) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const sides = airSides(x, y, z);
    const edge = sides.length > 0;
    const corner = sides.length > 1;
    if (y === 0) { g.set(x, y, z, edge ? "polished_granite" : "stone_bricks"); continue; }    // plinth and foundation
    if (y === t - 1) { g.set(x, y, z, edge ? "chiseled_sandstone" : "stone"); continue; }     // roof, cornice on the edge
    if (y % 3 === 0) { g.set(x, y, z, edge ? "chiseled_sandstone" : "stone"); continue; }     // storey belt and floor slab
    if (!edge) continue;                                                                       // interior air
    const base = y < 3;                                                                        // the shopfront storey
    if (base && x === N - 1 && doorZ.includes(z) && sides.some(([dx]) => dx === 1)) {          // double doors
      g.set(x, y, z, "dark_oak_door", { facing: "east", half: y === 1 ? "lower" : "upper", hinge: z === doorZ[0] ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    const alongX = sides[0][0] === 0;                                                          // the face runs along x
    const pos = alongX ? x : z;
    const pier = corner || pos % 3 === 0;
    if (y % 3 === 2) { g.set(x, y, z, base ? "polished_granite" : "smooth_sandstone"); continue; }   // lintel, spandrel, shop header
    if (pier) { g.set(x, y, z, base ? "polished_granite" : "smooth_sandstone"); continue; }         // pier between bays
    g.set(x, y, z, "glass_pane");
    // Warm light behind some upper-storey glass: one block inside, in the air, on the floor slab.
    const [dx, dz] = sides[0];
    const ix = x - dx, iz = z - dz;
    if (!base && inFoot(ix, iz) && T(ix, iz) > y && g.get(ix, y, iz) === null) {
      const k = (x * 7 + z * 13 + y * 5) % 9;
      if (k === 0) { g.set(ix, y, iz, "glowstone"); lights++; }
      else if (k === 5) { g.set(ix, y, iz, "shroomlight"); lights++; }
    }
  }
}

// 3. Roof equipment on the top tier: a small penthouse, glazed ring around an air core, standing on the roof.
for (let x = 14; x <= 16; x++) for (let z = 4; z <= 6; z++) {
  g.set(x, 51, z, "smooth_sandstone");
  if (x !== 15 || z !== 5) g.set(x, 52, z, "glass_pane");
  g.set(x, 53, z, "chiseled_sandstone");
}

const out = `${DIR}/NYC1081152.nbt`;
const res = g.save(out);
const tiers = {};
for (const t of top.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log(JSON.stringify({ out, ...res, lights, tiers }));
