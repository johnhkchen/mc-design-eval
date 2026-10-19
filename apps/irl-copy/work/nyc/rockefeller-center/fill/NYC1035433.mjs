// 5 East 48 Street, 1920 Public Facilities & Institutions: a seven-storey Beaux-Arts institutional block in pale limestone
// (calcite), on a stone-brick base course. Footprint 8 x 23 (x across, low z = north = the 48th Street frontage, where the
// entrance is). The lidar roof is read as clean flat tiers, three storeys (roof 11) to seven (roof 23): a low three-storey
// wing at the north end, a four-storey band along the north half, a five-storey body in the middle, a six-storey side
// wall on the south and east, and the seven-storey pile at the south-west corner that carries a small plant bulkhead.
// Storeys run every 3 blocks: a belt course at 3s, two rows of windows above it (glass one block out from a solid core,
// air behind it: a recess, never a hole through the wall), mullions every third column, a solid calcite parapet on the
// roof edge. The NE forecourt is open ground (lidar 0), paved. Lit panes have glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035433.cells.json`, "utf8"));
const X = 8, Y = 35, Z = 23;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const built = (x, z) => inFoot(x, z) && cell.get(`${x},${z}`).roof > 0;

// Lidar roof to storeys: 3 blocks a storey, so a tier with k storeys has its roof surface at 3k + 2 (11, 14, 17, 20, 23).
const tierOfRoof = (r) => (r <= 12 ? 3 : r <= 15 ? 4 : r <= 18 ? 5 : r <= 21 ? 6 : 7);
const raw = new Map();
for (const [key, { roof }] of cell) if (roof > 0) raw.set(key, tierOfRoof(roof));

// Smooth the noise: a cell takes the most common tier among itself and its built neighbours (ties keep its own).
const tier = new Map();
for (const [key] of raw) {
  const [x, z] = key.split(",").map(Number);
  const count = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = `${x + dx},${z + dz}`;
    if (raw.has(k)) count.set(raw.get(k), (count.get(raw.get(k)) ?? 0) + 1);
  }
  const own = raw.get(key);
  let best = own, n = count.get(own) ?? 0;
  for (const [t, c] of count) if (c > n) { best = t; n = c; }
  tier.set(key, best);
}
if (process.env.TIERS) {
  for (let z = 0; z < Z; z++) console.log(String(z).padStart(2), Array.from({ length: X }, (_, x) => (built(x, z) ? tier.get(`${x},${z}`) : ".")).join(" "));
}

const topOf = (x, z) => (built(x, z) ? 3 * tier.get(`${x},${z}`) + 2 : 0);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// A cell is open at height y when it is outside the footprint, open ground, or its tier tops out at or below y.
const open = (x, y, z) => topOf(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};

const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on a face along z
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };  // pane on a face along x
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 9 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const recesses = [];

// 1. Solid core to each tier's roof, faces dressed on top of it. Open ground gets paving.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  if (!built(x, z)) { g.set(x, 0, z, "smooth_stone"); continue; }
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) g.set(x, y, z, "calcite");
  g.set(x, T - 1, z, "smooth_stone");                       // roof covering
}

// 2. Faces: base course, belt courses, cornice, balustrade, windows with mullions and recesses.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                              // position along the face
    if (y === T - 1) { g.set(x, y, z, "calcite"); continue; }                   // solid parapet on the roof edge
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // base course
    if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }              // belt course at each storey line
    if (u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                   // mullion
    g.set(x, y, z, "glass_pane", dx === 0 ? PANE_NS : PANE_EW);
    const ix = x - dx, iz = z - dz;                          // one block in, behind the glass
    const deep = inFoot(ix, iz) && built(ix, iz) && topOf(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : d === "E" ? 3 : 4)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Entrance on the north face (x 3-4): double bronze-look iron doors on a vestibule, a stone lintel over them
// standing on the belt course, and a lantern on each side. The lintel is a full block on a solid belt, so nothing floats.
g.set(3, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(4, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(4, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [3, 4]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 2; x <= 5; x++) g.set(x, 4, 0, "stone_bricks");
for (const x of [2, 5]) g.set(x, 1, 0, "lantern", { hanging: "false", waterlogged: "false" });

// 4. Roof plant: a two-block bulkhead on the seven-storey pile at the south-west (x 1-2, z 12-13), with a lantern on top.
for (const x of [1, 2]) for (const z of [12, 13]) for (const y of [23, 24]) g.set(x, y, z, "smooth_quartz");
g.set(1, 25, 12, "lantern", { hanging: "false", waterlogged: "false" });

// Check: every solid block either sits on a solid block, stands on the ground or is held by a neighbour (no floaters).
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = g.get(x, y, z);
  if (!b || b.block === "minecraft:glowstone") continue;
  if (g.get(x, y - 1, z)) continue;
  const held = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!held) floating++;
}

const stats = g.save(`${DIR}/NYC1035433.nbt`);
console.log(JSON.stringify({ footprint: cells.length, roofMaxBlock: Math.max(...cells.map(([x, z]) => topOf(x, z))), floating, ...stats }));
