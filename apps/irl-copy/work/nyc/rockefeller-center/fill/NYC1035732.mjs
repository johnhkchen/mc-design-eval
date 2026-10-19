// 390 Park Avenue, 1952 commercial and office building (NYC individual landmark). Decided from the record: a 1950s
// office slab of about 26 storeys on a four-storey base, read off the lidar as flat tiers (the 3x3 median of the roof,
// snapped to open court, base 12, wing 18, a tall strip on the west edge at 45, and the tower at 78). The tower is a
// pale stone frame: calcite piers and spandrel rows between ribbons of blue glass, on a dark granite base whose
// ground storey is a shopfront. Each storey's floor slab is solid across the footprint; behind the glass is one block
// of air and then a concrete core (no interiors). The lobby is a recessed bay on the north face under a calcite canopy,
// with iron doors and a glass transom. The tower roof has a parapet, and a mechanical penthouse set back on it.
// Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035732.cells.json`, "utf8"));
const X = 44, Y = 84, Z = 54;

const K = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [K(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(K(x, z));
const groundAt = (x, z) => cell.get(K(x, z)).ground;

// Roof tiers: the 3x3 median of the lidar roof (footprint cells only), snapped to one of five flat tops. 0-3 is open
// court (paved on its ground only); 4-14 the four-storey base; 15-25 the wing; 26-60 the tall west strip; 61+ the tower.
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
const smoothRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(cell.get(K(x + dx, z + dz)).roof);
  return median(v);
};
const tierOf = (r) => (r <= 3 ? 0 : r <= 14 ? 12 : r <= 25 ? 18 : r <= 60 ? 45 : 78);
const topOf = new Map();
for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  // Lidar spikes are not walls: the two-block strip on the west edge and the isolated one- and two-block needles read as
  // stray pins at block scale, so a tall-tier cell needs a tall neighbourhood (4 of its 9), else it takes the wing's top.
  const tallNeighbours = [-1, 0, 1].flatMap((dz) => [-1, 0, 1].map((dx) => (inFoot(x + dx, z + dz) ? cell.get(K(x + dx, z + dz)).roof : 0)))
    .filter((r) => r >= 26).length;
  const t0 = tierOf(smoothRoof(x, z)), t = t0 >= 45 && (x <= 1 || tallNeighbours < 4) ? 18 : t0;
  topOf.set(k, t === 0 ? ground + 1 : t);
}
const top = (x, z) => topOf.get(K(x, z)) ?? 0;

// The entrance: a recessed lobby bay on the north face (z 0-1, x 19-24, storeys 0 only).
const recess = (x, y, z) => z <= 1 && x >= 19 && x <= 24 && y >= 1 && y <= 3;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (x, y, z) => (x * 7 + y * 13 + z * 5) % 17 === 0;                                      // sparse warm panes

const g = new Voxels([X, Y, Z]);

for (let y = 0; y < Y; y++) {
  const solid = (x, z) => inFoot(x, z) && y < top(x, z) && !recess(x, y, z);

  // Depth from the outside at this height: 0 = skin (touches open air), 1 = the air gap behind it, 2+ = core.
  const depth = new Map(), queue = [];
  for (const k of cell.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (solid(x, z) && DIRS.some(([dx, dz]) => !solid(x + dx, z + dz))) { depth.set(K(x, z), 0); queue.push([x, z]); }
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i], d = depth.get(K(x, z));
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!solid(nx, nz) || depth.has(K(nx, nz))) continue;
      depth.set(K(nx, nz), d + 1); queue.push([nx, nz]);
    }
  }

  for (const k of cell.keys()) {
    const [x, z] = k.split(",").map(Number);
    const t = top(x, z), gr = groundAt(x, z);
    const building = t > gr + 1;

    // The parapet: the top course of a building cell whose edge drops to lower roof or open ground.
    if (building && y === t && DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= t)) {
      g.set(x, y, z, "calcite");
      continue;
    }
    if (!solid(x, z)) continue;
    const d = depth.get(K(x, z)) ?? 2;

    if (y < gr) { g.set(x, y, z, "polished_granite"); continue; }                  // foundation to the lowest ground
    if (!building) { g.set(x, y, z, "smooth_stone"); continue; }                   // paved court on the ground
    if (y === t - 1) { g.set(x, y, z, d === 0 ? "calcite" : "smooth_stone"); continue; }   // cornice, roof covering

    const band = (((y - 1) % 3) + 3) % 3;   // 0 = the storey's slab and spandrel row; 1 and 2 = glass
    if (band === 0) {
      g.set(x, y, z, d === 0 && y <= 3 ? "polished_granite" : "calcite");          // storefront base, then slab/spandrel
      continue;
    }
    if (d >= 2) { g.set(x, y, z, "light_gray_concrete"); continue; }              // core
    if (d === 1) { if (lit(x, y, z)) g.set(x, y, z, "glowstone"); continue; }     // the air gap behind the glass
    // Skin: blue glass panes between calcite piers every third block along the face.
    const alongX = DIRS.slice(0, 2).some(([dx, dz]) => !solid(x + dx, z + dz));
    const p = alongX ? x : z;
    if (p % 3 === 0) g.set(x, y, z, "calcite");
    else g.set(x, y, z, "light_blue_stained_glass_pane", alongX ? NS : EW);
  }
}

// Lobby bay on the north face: iron doors, a glass transom, and two lanterns hung from the canopy.
g.set(21, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(21, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(22, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(22, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let x = 20; x <= 23; x++) g.set(x, 3, 0, "light_blue_stained_glass_pane", NS);
g.set(19, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(24, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Mechanical penthouse, set back in the middle of the tower roof: calcite walls, concrete inside, a stone cap.
for (let x = 14; x <= 31; x++) for (let z = 14; z <= 21; z++) {
  const edge = x === 14 || x === 31 || z === 14 || z === 21;
  for (let y = 78; y <= 80; y++) g.set(x, y, z, edge ? "calcite" : "light_gray_concrete");
  g.set(x, 81, z, "smooth_stone");
}

const stats = g.save(`${DIR}/NYC1035732.nbt`);
console.log(JSON.stringify(stats));
