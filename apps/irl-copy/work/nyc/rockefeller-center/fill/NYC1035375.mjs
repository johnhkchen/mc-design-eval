// 52 Vanderbilt Avenue, 1916 commercial & office building: a setback office block of the zoning years, when a tower
// was stepped back from the street wall to let light down to it. Footprint 25 x 28 (x across the front, low z = north
// = the street wall). Massing read from the lidar, smoothed into clean tiers: a 12-block wing at the west (lidar 6-12),
// an 18-block street wall (six storeys) around the outer two cells, a 45-block setback over the next two, the 75-block
// office tower behind, a 79-block tower at the south-east (lidar 77-79), and a copper-capped 81-block penthouse on the
// main tower. Two small lidar voids are filled, the 30-cell-or-larger court at the south-west stays open at grade.
// Every tier is a solid column from grade, so nothing floats. Facade: a granite plinth and shopfront band at grade,
// brick shafts on a 3-block storey grid (a calcite string course, then two rows of glass between calcite piers),
// a calcite cornice and a stone-brick parapet at each roof edge. Behind glass there is an air gap one block deep
// (where the block behind is enclosed), a few panes have glowstone in that gap. Entrance on the north street wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035375.cells.json`, "utf8"));
const X = 25, Y = 91, Z = 28;

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [k2(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(k2(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E: [dx, dz] points out of the building

// 1. Lidar voids: a zero-roof run inside the footprint under 30 cells is a lidar miss (light wells the laser never
// saw the floor of), so it is built at the tower height; a larger zero-roof run is a court and stays open.
const voidFill = new Set(), seen = new Set();
for (const [x, z, , roof] of cells) {
  if (roof !== 0 || seen.has(k2(x, z))) continue;
  const run = [[x, z]]; seen.add(k2(x, z));
  for (let i = 0; i < run.length; i++) {
    const [a, b] = run[i];
    for (const [dx, dz] of DIRS) {
      const n = k2(a + dx, b + dz);
      if (inFoot(a + dx, b + dz) && cell.get(n).roof === 0 && !seen.has(n)) { seen.add(n); run.push([a + dx, b + dz]); }
    }
  }
  if (run.length < 30) for (const [a, b] of run) voidFill.add(k2(a, b));
}

// 2. Which cells carry a building: the lidar roof above 5 blocks (roof 0-1 is open ground), voids included.
const built = (x, z) => inFoot(x, z) && (voidFill.has(k2(x, z)) || cell.get(k2(x, z)).roof >= 6);
const lidarRoof = (x, z) => (voidFill.has(k2(x, z)) ? 75 : cell.get(k2(x, z)).roof);

// 3. Storey distance from the outside (outside the footprint or open ground): the street wall is 1 or 2 deep.
const dist = new Map();
const queue = [];
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!built(x, z)) continue;
  if (DIRS.some(([dx, dz]) => !built(x + dx, z + dz))) { dist.set(key, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(k2(x, z));
  for (const [dx, dz] of DIRS) {
    const n = k2(x + dx, z + dz);
    if (built(x + dx, z + dz) && !dist.has(n)) { dist.set(n, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// The tallest lidar (77+) counts as the south-east tower only where it is a real mass: runs under 10 cells are noise.
const tall = new Set(), tallSeen = new Set();
for (const [x, z, , roof] of cells) {
  if (roof < 77 || tallSeen.has(k2(x, z))) continue;
  const run = [[x, z]]; tallSeen.add(k2(x, z));
  for (let i = 0; i < run.length; i++) {
    const [a, b] = run[i];
    for (const [dx, dz] of DIRS) {
      const n = k2(a + dx, b + dz);
      if (inFoot(a + dx, b + dz) && cell.get(n).roof >= 77 && !tallSeen.has(n)) { tallSeen.add(n); run.push([a + dx, b + dz]); }
    }
  }
  if (run.length >= 10) for (const [a, b] of run) tall.add(k2(a, b));
}

// 4. Tiers: wing 12, street wall 18 (two cells deep), first setback 45 (next two), the tower core 75, the south-east
// tower 79 (lidar 77+), and the penthouse 81 at the centre of the main tower. 75 is the lidar's flat roof.
const top = new Map();
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!built(x, z)) continue;
  const L = lidarRoof(x, z), d = dist.get(key);
  let T;
  if (L <= 12) T = 12;
  else if (tall.has(key)) T = 79;
  else if (d <= 2) T = 18;
  else if (d <= 4) T = 45;
  else T = 75;
  if (x >= 9 && x <= 15 && z >= 9 && z <= 17 && T === 75) T = 81;
  top.set(key, T);
}
const T = (x, z) => (built(x, z) ? top.get(k2(x, z)) : 0);
const ground = (x, z) => cell.get(k2(x, z)).ground;

// A face is open at height y when the neighbour outside it is open ground, outside, or lower than y.
const openAt = (x, z, y) => !built(x, z) || T(x, z) <= y;
const facesAt = (x, z, y) => DIRS.filter(([dx, dz]) => openAt(x + dx, z + dz, y));

// 5. Facade grammar. u runs along the face: x on a north or south face, z on an east or west face.
const ENTRANCE = (x, z) => z === 0 && x >= 11 && x <= 13;
const facadeBlock = (x, y, z, [dx, dz]) => {
  const u = dx === 0 ? x : z;
  const paneState = dx === 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  if (ENTRANCE(x, z) && x === 12 && (y === 1 || y === 2)) return ["iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (ENTRANCE(x, z) && y === 5) return ["polished_granite"];
  if (ENTRANCE(x, z) && y === 4) return ["glass_pane", paneState];
  if (ENTRANCE(x, z) && y === 6) return ["smooth_stone"];                  // the canopy over the door
  if (y < 3) return ["polished_granite"];                                  // plinth
  if (y === 3 || (y >= 6 && y % 3 === 0)) return ["calcite"];              // threshold and storey string courses
  if (y === 4 || y === 5) return u % 3 === 0 ? ["polished_granite"] : ["glass_pane", paneState];   // shopfronts
  return u % 3 === 0 ? ["calcite"] : ["glass_pane", paneState];           // window rows between limestone piers
};
const isGlass = (x, y, z, f) => {
  const [b] = facadeBlock(x, y, z, f);
  return b === "glass_pane";
};

// 6. Air gaps: a pane whose block behind is enclosed (all four of its sides built and higher than y) gets an air
// cell behind it, so the glass sits in front of a room rather than a wall. A few of those rooms have warm light.
const air = new Set(), lit = new Set();
for (const [key] of top) {
  const [x, z] = key.split(",").map(Number), t = top.get(key);
  for (let y = 3; y <= t - 2; y++) {
    if (y % 3 === 0) continue;                                             // floor slabs stay solid
    const fs = facesAt(x, z, y);
    if (!fs.length || !isGlass(x, y, z, fs[0])) continue;
    const [dx, dz] = fs[0], bx = x - dx, bz = z - dz;
    const enclosed = built(bx, bz) && T(bx, bz) >= y + 2 && DIRS.every(([ex, ez]) => built(bx + ex, bz + ez) && T(bx + ex, bz + ez) >= y + 2);
    if (!enclosed || ENTRANCE(bx, bz) && bz === 0) continue;
    air.add(k3(bx, y, bz));
    const u = dx === 0 ? x : z;
    if ((u * 5 + y * 7 + (dx === 0 ? 3 : 0)) % 9 === 0) lit.add(k3(bx, y, bz));
  }
}

// 7. Build. Open ground gets one paving course at y 0; built cells stand on a granite foundation to their ground.
const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  if (!built(x, z)) { g.set(x, 0, z, "stone_bricks"); continue; }
  const t = T(x, z), G = ground(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "polished_granite");
  for (let y = G; y < t; y++) {
    const fs = facesAt(x, z, y);
    if (air.has(k3(x, y, z))) {
      if (lit.has(k3(x, y, z))) g.set(x, y, z, "glowstone");
      continue;
    }
    if (y === t - 1) {
      if (t >= 79) g.set(x, y, z, "oxidized_copper");
      else g.set(x, y, z, fs.length ? "calcite" : "stone");                // cornice at edges, roof covering inside
      continue;
    }
    if (!fs.length) { g.set(x, y, z, "bricks"); continue; }                // solid core
    const [block, state] = facadeBlock(x, y, z, fs[0]);
    g.set(x, y, z, block, state);
  }
  // Parapet on every roof edge that drops to lower roof or open ground; connected along the edge.
  const edge = (n) => !built(n[0], n[1]) || T(n[0], n[1]) < t;
  const hasP = DIRS.some((d) => edge([x + d[0], z + d[1]]));
  if (hasP) {
    const side = (dx, dz) => (built(x + dx, z + dz) && T(x + dx, z + dz) === t && DIRS.some((d) => !built(x + dx + d[0], z + dz + d[1]) || T(x + dx + d[0], z + dz + d[1]) < t) ? "low" : "none");
    g.set(x, t, z, "stone_brick_wall", {
      up: "true",
      north: side(0, -1), south: side(0, 1), west: side(-1, 0), east: side(1, 0), waterlogged: "false",
    });
  }
}

// Door: the iron door sits in the plinth, the glass vestibule and the canopy are above it.
const saved = g.save(`${DIR}/NYC1035375.nbt`);
console.log(JSON.stringify({ built: [...top.keys()].length, blocks: saved.blocks, palette: saved.palette, air: air.size, lit: lit.size }));
