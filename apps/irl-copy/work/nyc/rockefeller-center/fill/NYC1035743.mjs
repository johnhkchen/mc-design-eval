// 19 East 54th Street (NYC individual landmark, 1900): an eight-storey commercial-and-office block in the
// Renaissance Revival manner of its date. A granite base with a shopfront and a recessed entrance, red brick piers
// between pane windows, calcite string courses every third block, a heavy cornice and parapet, and a lower rear wing.
// The lidar roof is smoothed into tiers: rim and interior roof, the low wing at the south end (z 21-22), and a
// roof-equipment bulkhead on the 30-31 cluster. The shell is one block thick and the inside is air with a floor
// slab per storey, so the glass has an air gap behind it. Warm lights sit in a few windows just inside the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035743.cells.json`, "utf8"));
const W = 12, D = 23, H = 43;

// Footprint, ground and lidar roof per cell.
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, r); }
const inF = (x, z) => ground.has(`${x},${z}`);
const F0 = Math.max(...ground.values());                 // the ground floor's base: the highest ground under the footprint

// Smoothed lidar roof: the median of each cell's 3x3 neighbourhood.
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roof.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r); }
  return v.sort((a, b) => a - b)[v.length >> 1];
};
const rim = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz));

// Roof tiers: the top of the solid column in each cell (exclusive). Rim parapet at 30, interior deck at 28.
const top = (x, z) => {
  if (med(x, z) <= 23) return 22;                                   // lower rear wing (lidar 18-21)
  if (x >= 1 && x <= 3 && z >= 6 && z <= 8) return 32;             // roof equipment: the lidar 30-31 cluster
  return rim(x, z) ? 30 : 28;
};
const bulk = (x, z) => top(x, z) === 32;

// Storey lines: the ground floor's base at F0, then the upper storeys every 3 blocks, the last at the cornice.
const FL = [F0];
for (let b = F0 + 4; b <= 27; b += 3) FL.push(b);

// Solid where a column stands: foundation below F0, then up to each cell's roof tier.
const bld = (x, y, z) => { if (y < 0) return true; if (!inF(x, z)) return false; return y < F0 || y < top(x, z); };
const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const exposed = (x, y, z, [dx, dy, dz]) => !bld(x + dx, y + dy, z + dz);
const isShell = (x, y, z) => bld(x, y, z) && NB.some((d) => exposed(x, y, z, d));
const isInterior = (x, y, z) => bld(x, y, z) && !isShell(x, y, z);

// Calcite string courses on the facade: the storey lines above the ground floor, the cornice and parapet (main),
// and the band at 30 on the roof equipment.
const isCalRow = (x, z, y) =>
  (FL.includes(y) && y > F0) || ((y === 28 || y === 29) && !bulk(x, z)) || (y === 30 && bulk(x, z));

// Facade material for an outward-facing shell block. plane: "z-" street, "z+" rear, "x-", "x+" sides.
function facade(x, y, z, plane) {
  const pos = plane[0] === "z" ? x : z;                            // bays run along the facade
  const pier = pos % 3 === 2;
  if (y < F0) return { block: "stone_bricks" };                    // rusticated base, showing extra storeys on the downhill side
  if (y === F0) return { block: "polished_granite" };              // base course
  if (y < F0 + 4) {                                                // ground storey: shopfront, then a granite transom
    if (y === F0 + 3) return { block: "polished_granite" };
    return pier ? { block: "polished_granite" } : { block: "glass_pane", plane };
  }
  if (isCalRow(x, z, y)) return { block: "calcite" };
  return pier ? { block: "bricks" } : { block: "glass_pane", plane };
}

const g = new Voxels([W, H, D]);
const counts = { shell: 0, floor: 0, fill: 0, glass: 0, lamps: 0 };
const planeOf = (x, y, z) => {
  for (const [name, [dx, dy, dz]] of [["z-", [0, 0, -1]], ["z+", [0, 0, 1]], ["x-", [-1, 0, 0]], ["x+", [1, 0, 0]]])
    if (!bld(x + dx, y + dy, z + dz)) return name;
  return null;
};

// Lamps: some windows on the street and rear facades get a warm light just inside the glass.
const lampAt = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  for (let y = 0; y < top(x, z) && y < H; y++) {
    if (!bld(x, y, z)) continue;
    if (!isShell(x, y, z)) {
      if (y < F0) { g.set(x, y, z, "stone_bricks"); counts.fill++; }
      else if (FL.includes(y)) { g.set(x, y, z, "smooth_stone"); counts.floor++; }
      continue;                                                     // air inside: an air gap behind the glass
    }
    counts.shell++;
    const up = exposed(x, y, z, [0, 1, 0]);
    const plane = planeOf(x, y, z);
    if (up && plane) { g.set(x, y, z, "calcite"); continue; }       // parapet, bulkhead cap, wing cornice
    if (up) { g.set(x, y, z, "stone"); continue; }                  // gravel-and-stone roof deck
    const f = facade(x, y, z, plane);
    // Street entrance: a dark oak door with a canopy band above it, set in the shopfront.
    if (plane === "z-" && z === 0 && x === 7 && (y === F0 + 1 || y === F0 + 2)) {
      const half = y === F0 + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (plane === "z-" && z === 0 && y === F0 + 3 && x >= 6 && x <= 8) {
      g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (f.block === "glass_pane") {
      // Connect to the neighbours in the plane of the pane, so the bars read as one run of glass.
      const inPlane = plane[0] === "z"
        ? { north: "false", south: "false", east: bld(x + 1, y, z) ? "true" : "false", west: bld(x - 1, y, z) ? "true" : "false" }
        : { east: "false", west: "false", north: bld(x, y, z - 1) ? "true" : "false", south: bld(x, y, z + 1) ? "true" : "false" };
      g.set(x, y, z, "glass_pane", { ...inPlane, waterlogged: "false" });
      counts.glass++;
      const inner = { "z-": [0, 0, 1], "z+": [0, 0, -1], "x-": [1, 0, 0], "x+": [-1, 0, 0] }[plane];
      const [ix, iy, iz] = [x + inner[0], y, z + inner[2]];
      if ((plane === "z-" || plane === "z+") && isInterior(ix, iy, iz) && !FL.includes(iy) && lampAt(x, y, z)) {
        g.set(ix, iy, iz, "glowstone"); counts.lamps++;
      }
      continue;
    }
    g.set(x, y, z, f.block);
  }
}

const out = g.save(`${DIR}/NYC1035743.nbt`);
console.log(JSON.stringify({ F0, floors: FL, footprint: cells.length, ...counts, saved: out }));
