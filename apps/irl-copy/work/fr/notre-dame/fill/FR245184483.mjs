// FR245184483: a commercial block of four storeys under a mansard, built on the lidar footprint (49 x 35 cells, flat ground at y 0,
// roof record 23 blocks). Limestone (calcite) walls, a stone-brick plinth, a striped awning band over the ground-floor shopfronts,
// and a two-tier deepslate mansard. Storey floors are full slabs at y = 0, 5, 10, 15 (the floor under each storey), and each
// storey's window band is 3 glass rows under a calcite lintel, with a balcony rail on the noble floor. Interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184483.cells.json`, "utf8"));

const W = 49, H = 39, D = 35;
const FLOOR = [0, 5, 10, 15];        // full-footprint slabs (each storey stands on one)
const CORNICE = 20;                  // full slab that carries the mansard
const MANSARD = [21, 22];            // two tiers of stairs stepping in
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const fp = new Map();                // "x,z" -> { g, roof }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, roof: r });
const inside = (x, z) => fp.has(`${x},${z}`);
const at = (x, z) => fp.get(`${x},${z}`);

// The lidar roof is 23 blocks on every cell (a flat record), so the mansard's top is the roof at y 23.
const TOP = 23;

// Exterior faces: which sides of a cell have no footprint cell beside them.
const exposedDirs = (x, z) => NEI.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([n]) => n);
const isExt = (x, z) => exposedDirs(x, z).length > 0;

// Distance inward from the edge (edge = 0), for the mansard.
const dist = new Map(), queue = [];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isExt(x, z)) { dist.set(key, 0); queue.push(key); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number), d = dist.get(queue[i]);
  for (const [, dx, dz] of NEI) {
    const k = `${x + dx},${z + dz}`;
    if (inside(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(k); }
  }
}
// The way out of the slope at distance d: the exposed face of an edge cell, else the neighbour one step nearer the edge.
function outwardOf(x, z, d) {
  const ex = exposedDirs(x, z);
  if (d === 0) return ex[0] ?? "north";
  for (const [name, dx, dz] of NEI) if (dist.get(`${x + dx},${z + dz}`) === d - 1) return name;
  return "north";
}

// Doors: on the two faces with the most ground-floor exposure, the middle cell of each face (single-face cells preferred).
const doorMap = new Map();           // "x,z" -> facing
const faceCells = new Map(NEI.map(([n]) => [n, []]));
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposedDirs(x, z);
  for (const n of ex) faceCells.get(n).push([x, z, ex.length]);
}
const faceRank = NEI.map(([n]) => n).sort((a, b) => faceCells.get(b).length - faceCells.get(a).length).slice(0, 2);
for (const face of faceRank) {
  const along = face === "north" || face === "south" ? 0 : 1;             // index along the face
  const list = faceCells.get(face).filter(([, , n]) => n === 1).sort((a, b) => a[along] - b[along]);
  const pool = list.length ? list : faceCells.get(face).sort((a, b) => a[along] - b[along]);
  if (!pool.length) continue;
  const [x0, z0] = pool[Math.floor(pool.length / 2)];
  doorMap.set(`${x0},${z0}`, face);
}

// A pier between windows (calcite), on the face's own axis; a cell on a north or south face is spaced along x, else along z.
const pierAt = (x, z, dirs) => {
  const onZ = dirs.includes("north") || dirs.includes("south");
  return (onZ ? x : z) % 3 === 0;
};
const paneState = (dirs) => {
  const onZ = dirs.includes("north") || dirs.includes("south");
  return onZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};
const railState = (dirs) => {
  const onZ = dirs.includes("north") || dirs.includes("south");
  return onZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Awning: alternate red and white stripes along the face, on the ground floor's top course.
const stripeOf = (x, z, dirs) => ((dirs.includes("north") || dirs.includes("south")) ? x : z);

// Classify one cell at height y: [block, state] or null (air).
function cls(x, z, y) {
  if (!inside(x, z)) return null;
  const dirs = exposedDirs(x, z), ext = dirs.length > 0;
  const dk = `${x},${z}`;
  if (y === 0) return ["stone_bricks"];                                    // the foundation course, flush under everything
  if (FLOOR.includes(y)) return ["smooth_stone"];                          // a full floor slab per storey
  if (y === CORNICE) return ext ? ["calcite"] : ["smooth_stone"];          // the cornice ring carries the mansard
  if (MANSARD.includes(y)) {
    const d = dist.get(dk) ?? 99, j = y - MANSARD[0];                       // tier 0 at y=21, tier 1 at y=22
    if (d === j) return ["deepslate_tile_stairs", { facing: outwardOf(x, z, d), half: "bottom", shape: "straight", waterlogged: "false" }];
    if (d > j) return ["deepslate_tiles"];
    return null;
  }
  if (!ext) return null;                                                   // interior air behind the facade
  if (y === 1) return ["stone_bricks"];                                    // plinth
  if (y === 2 || y === 3) {                                                // shopfront: glass, piers, the door
    if (doorMap.has(dk)) {
      const facing = doorMap.get(dk);
      return ["dark_oak_door", { facing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (pierAt(x, z, dirs)) return ["calcite"];
    return ["glass_pane", paneState(dirs)];
  }
  if (y === 4) {                                                           // the awning band over the shopfront
    if (doorMap.has(dk)) return ["chiseled_stone_bricks"];
    return [stripeOf(x, z, dirs) % 2 === 0 ? "red_wool" : "white_wool"];
  }
  // Upper storeys: sill, three window rows, lintel. Storey 2 is the noble floor with a balcony rail on its sill.
  for (const [lo, hi] of [[6, 9], [11, 14], [16, 19]]) {
    if (y < lo || y > hi) continue;
    const row = y - lo;                                                    // 0 = sill, last = lintel
    if (row === hi - lo) return ["calcite"];                              // lintel
    if (pierAt(x, z, dirs)) return ["calcite"];                            // pier
    if (lo === 6 && row === 0) return ["iron_bars", railState(dirs)];      // balcony rail
    return ["glass_pane", paneState(dirs)];
  }
  return null;
}

const g = new Voxels([W, H, D]);
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < TOP; y++) { const b = cls(x, z, y); if (b) g.set(x, y, z, b[0], b[1]); }
}

// Roof: a flat deck with a couple of brick chimney stacks on the mansard top (the tiers are full inside).
let chimneys = 0;
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if ((dist.get(key) ?? 0) < 4 || x % 10 !== 5 || z % 7 !== 3) continue;
  for (let y = TOP; y <= TOP + 1; y++) g.set(x, y, z, "bricks");
  g.set(x, TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  chimneys++;
}

// Warm light behind some upper-floor glass: a glowstone one cell inside the pane (the air gap stays everywhere else).
let lights = 0;
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const dirs = exposedDirs(x, z);
  if (!dirs.length) continue;
  for (const y of [7, 12, 17]) {                                          // the middle glass row of each upper storey
    if ((x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const b = cls(x, z, y); if (!b || b[0] !== "glass_pane") continue;
    const [, dx, dz] = NEI.find(([n]) => n === OPP[dirs[0]]);
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && cls(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lights++; }
  }
}

const out = `${DIR}/FR245184483.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${lights} lit windows, ${chimneys} chimneys, doors ${[...doorMap.entries()].map(([k, f]) => `${k}:${f}`).join(" ")}`);
