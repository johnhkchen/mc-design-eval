// 41 West 47th Street, a 1920 mixed residential and commercial building: a 7 x 26 block footprint (x across the front,
// low z = north = the 47th Street frontage). Stepped massing read from the lidar: a one-storey shop front on the street
// (z 0-3), a three-storey wing behind it (z 4-8 and the rear step at z 25), a five-storey middle (15 blocks) and an
// east rear tower that climbs to six storeys (18 blocks) at the back, with a six-storey west spine along the whole side.
// The rear light court at (1, 4) and (1, 6) and the rear corner (6, 25) have no roof in the lidar, so they stay open
// paving. Storeys are 3 blocks: a limestone string course at each floor line, two rows of glass panes between them
// (brick piers every third block), a calcite cornice and a brick parapet on each roof edge, and a stone roof covering.
// The shop front has a dark oak door, glass display windows and a dark awning band. Each window is glass with an air
// gap one block behind and a floor slab per storey; some gaps hold a lantern. There are no interiors. A brick roof
// penthouse with a calcite cap stands on the east tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034476.cells.json`, "utf8"));
const X = 7, Y = 23, Z = 26;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tiers, in blocks above y 0, flattened from the lidar. 0 = nothing built (open ground or outside the footprint).
const tierAt = (x, z) => {
  if (!inFoot(x, z) || cell.get(`${x},${z}`).roof === 0) return 0;
  if (x === 0) return z === 0 ? 4 : z === 1 ? 15 : 18;      // the west spine
  if (z <= 3) return 4;                                    // the one-storey shop front
  if (z <= 8 || z === 25) return 9;                        // the three-storey wing and the rear step
  if (x >= 5) return z <= 12 ? 15 : 18;                    // the east rear tower
  return 15;
};
const open = (x, y, z) => tierAt(x, z) <= y;               // outside the footprint counts as open

// Outward faces. N = low z (47th Street); the order is the priority at corners.
const DIRS = { N: [0, -1], W: [-1, 0], E: [1, 0], S: [0, 1] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "W", "E", "S"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (x, y, z) => (x * 7 + y * 13 + z * 5) % 6 === 0;   // about one window in six shows a warm lantern

const g = new Voxels([X, Y, Z]);
const windows = [];       // [x, y, z, inner x, inner z] for each glass pane, carved to an air gap after the faces

// 1. Solid mass from y 0 to each tier, on the lot's ground (0 here), with a paved court where nothing is built.
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number), t = tierAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!t) { g.set(x, ground, z, "stone_bricks"); continue; }
  for (let y = ground; y < t; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Faces, and the roof covering and cornice on each top.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number), t = tierAt(x, z);
  if (!t) continue;
  for (let y = 0; y < t; y++) {
    const d = faceOf(x, y, z);
    if (y === t - 1) {                                     // the top course
      if (!d) { g.set(x, y, z, "stone"); continue; }       // roof covering
      if (t === 4 && d === "N" && (x === 1 || x === 2)) { g.set(x, y, z, "black_concrete"); continue; }   // awning band
      g.set(x, y, z, "calcite"); continue;                 // cornice
    }
    if (!d) continue;
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }    // base course
    const [dx, dz] = DIRS[d], along = dx === 0 ? x : z;   // position along the face
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }    // string course at each floor line
    if (y < 3 && d === "N") {                             // shop front
      if (along % 3 === 0) { g.set(x, y, z, "dark_oak_planks"); continue; }
      if (along === 1) {                                  // the entrance
        const half = y === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, "glass");
      windows.push([x, y, z, x - dx, z - dz]);
      continue;
    }
    if (along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }     // brick pier
    g.set(x, y, z, "glass_pane", dx === 0 ? PANE_NS : PANE_EW);
    windows.push([x, y, z, x - dx, z - dz]);
  }
}

// 3. Parapet: one brick course on every roof edge, where a neighbour stands lower. The penthouse is set over it below.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number), t = tierAt(x, z);
  if (!t) continue;
  const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => open(x + dx, t - 1, z + dz));
  if (edge) g.set(x, t, z, "bricks");
}

// 4. The rooftop penthouse on the east tower: brick walls on the 18-block roof, a calcite cap.
for (let x = 5; x <= 6; x++) for (let z = 16; z <= 17; z++) {
  g.set(x, 18, z, "bricks"); g.set(x, 19, z, "bricks"); g.set(x, 20, z, "calcite");
}

// 5. The air gap behind each glass pane (and behind the shop glass), kept only where the building is solid, then a lantern
// in some of them: a standing lantern in the middle row of a storey (it stands on the floor slab), so it never hangs free.
for (const [x, y, z, ix, iz] of windows) {
  if (tierAt(ix, iz) <= y) continue;
  g.set(ix, y, iz, "air");
  if (y % 3 === 1 && lit(x, y, z)) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1034476.nbt`);
console.log(stats);
