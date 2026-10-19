// 39 East 51st Street, 1940 commercial and office building: a narrow mid-block Art Deco office block in cream terracotta
// and light-blue glass, a 25-block (about 28 m) tower on a 21-block shoulder, with a 28-block mechanical penthouse on the
// tower's middle. Footprint 8 x 25 (x across the street front, high z = south = the 51st Street frontage; low z is the
// rear court, which the lidar has at ground level). Tiers are read from the lidar as flat steps: a court where the roof
// is at ground, a 21-block shoulder for every built cell that is not in the tower's core, the 25-block tower on z 7-16,
// and a 28-block penthouse on x 4-6, z 11-14. Each storey is 3 blocks: a floor band (quartz), then two rows of glass
// between cream piers on every third block. The ground storey has a granite base, dark shopfront glass, a granite
// doorway at x 4 with an iron door and a granite lintel. Glass sits in the outer skin with air behind it and a floor
// slab per storey (no interiors). Warm glowstone sits behind some panes. Every solid block has solid below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035472.cells.json`, "utf8"));
const X = 8, Y = 30, Z = 25;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const groundOf = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);

// Tiers: the top of each column (block height, exclusive). 0 = nothing built.
const top = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (lidar(x, z) <= 1) return 1;                                       // open court at ground level
  if (z >= 7 && z <= 16 && lidar(x, z) >= 24) {
    if (x >= 4 && x <= 6 && z >= 11 && z <= 14) return 28;              // mechanical penthouse
    return 25;                                                          // office tower
  }
  return 21;                                                            // shoulder
};
const built = (x, y, z) => inFoot(x, z) && y < top(x, z);
const NB = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];      // [dx, dz, face]
const openSides = (x, y, z) => NB.filter(([dx, dz]) => !built(x + dx, y, z + dz));
const fnd = (x, z) => Math.max(groundOf(x, z), 1);                      // foundation rows: y < fnd
const isFloor = (y, T) => y % 3 === 1 || y === T - 2;                   // storey floors and the roof deck
const isSkin = (x, y, z) => built(x, y, z) && openSides(x, y, z).length > 0;

const solid = (x, y, z) => {
  if (!built(x, y, z)) return false;
  if (y < fnd(x, z)) return true;
  if (isFloor(y, top(x, z))) return true;
  return isSkin(x, y, z);
};

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const overrides = new Map();
const put = (x, y, z, block, state) => overrides.set(`${x},${y},${z}`, [block, state]);

// Entrance on the 51st Street front (z 24): iron door at x 4, granite frame at x 3 and 5, granite lintel over x 3-5.
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
for (const y of [2, 3]) {
  put(3, y, 24, "polished_granite");
  put(5, y, 24, "polished_granite");
}
put(4, 2, 24, "iron_door", { ...DOOR, half: "lower" });
put(4, 3, 24, "iron_door", { ...DOOR, half: "upper" });
for (const x of [3, 4, 5]) put(x, 4, 24, "polished_granite");

const g = new Voxels([X, Y, Z]);

// Blocks: foundation and bulkhead granite, court paving, cream terracotta piers, quartz bands and cornices, light-blue
// glass upstairs and dark glass in the shopfronts, with a warm glowstone behind some panes.
const WALL = "white_terracotta", BAND = "smooth_quartz", GLASS = "light_blue_stained_glass", SHOP = "gray_stained_glass";
const lit = (x, y, z) => (x * 5 + y * 3 + z * 7) % 8 === 0;
const interior = (x, y, z) => built(x, y, z) && !isSkin(x, y, z) && !isFloor(y, top(x, z));

for (const [x, z] of cols) {
  const T = top(x, z), f = fnd(x, z);
  for (let y = 0; y < f; y++) g.set(x, y, z, T === 1 ? "smooth_stone" : "polished_granite");
  for (let y = f; y < T; y++) {
    if (!solid(x, y, z)) continue;
    if (!isSkin(x, y, z)) { g.set(x, y, z, "smooth_stone"); continue; }     // floor or roof deck, inside
    const sides = openSides(x, y, z);
    const alongX = sides.some(([dx, dz]) => dz !== 0);                     // face runs along x (north or south)
    const u = alongX ? x : z;
    const corner = sides.length > 1 && sides.some(([dx]) => dx !== 0) && sides.some(([, dz]) => dz !== 0);
    let block = BAND;
    if (y === 1) block = "polished_granite";                                // bulkhead
    else if (y === T - 1 || y === T - 2 || y % 3 === 1) block = BAND;       // cornice, roof edge, storey band
    else block = corner || u % 3 === 0 ? WALL : (y <= 3 ? SHOP : GLASS);   // piers and panes
    g.set(x, y, z, block);
  }
}

// A wall that rises past a lower roof stands down to it: any wall block over air inside the building gets a wall block
// under it, until it reaches a floor or a roof.
for (let changed = true; changed;) {
  changed = false;
  for (const [x, z] of cols) for (let y = 1; y < top(x, z); y++) {
    const wall = g.get(x, y, z) && !(isFloor(y, top(x, z)) && !isSkin(x, y, z));   // any wall or fill, not a floor
    if (!wall || g.get(x, y - 1, z)) continue;
    g.set(x, y - 1, z, WALL); changed = true;
  }
}

// Overrides, the warm panes, the roof plant.
for (const [k, [block, state]] of overrides) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
for (const [x, z] of cols) {
  const T = top(x, z);
  for (let y = fnd(x, z); y < T; y++) {
    if (!isSkin(x, y, z) || isFloor(y, T) || y === T - 1) continue;
    const block = g.get(x, y, z)?.block;
    if (block !== GLASS && block !== SHOP) continue;
    if (overrides.has(`${x},${y},${z}`) || !lit(x, y, z)) continue;
    for (const [dx, dz] of NB.filter(([dx, dz]) => !built(x + dx, y, z + dz)).map(([dx, dz]) => [-dx, -dz])) {
      const ix = x + dx, iz = z + dz;
      if (interior(ix, y, iz) && !g.get(ix, y, iz)) { g.set(ix, y, iz, "glowstone"); break; }
    }
  }
}
for (let x = 3; x <= 4; x++) for (let z = 9; z <= 10; z++) for (let y = 24; y <= 25; y++) g.set(x, y, z, "light_gray_concrete");

const hanging = [];
for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (g.get(x, y, z) && !g.get(x, y - 1, z)) hanging.push(`${x},${y},${z}`);
}
const nonFloor = hanging.filter((k) => { const [x, y, z] = k.split(",").map(Number); return !(isFloor(y, top(x, z)) && !isSkin(x, y, z)); });
console.log("hanging", hanging.length, "non-floor", nonFloor.length, JSON.stringify(nonFloor));

const counts = g.save(`${DIR}/NYC1035472.nbt`);
console.log(JSON.stringify({ blocks: counts.blocks, palette: counts.palette, size: [X, Y, Z] }));
