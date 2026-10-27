// Cracker Bay, Auckland (OSM way 59585950). Read from the LINZ lidar record: a 97 x 65 footprint, five storeys of
// office on a stone plinth (roof deck about 26 blocks above the lowest ground), with a two-storey wing across the
// north-west and a lower ring stepping in at the tower's edges. Storey lines sit at y = 4 + 4k on every cell, so each
// tier stands on the one below. The whole footprint is solid from y 0 to the ground floor slab (y 4): the downhill
// side is plinth, not air under a floor. Mullions every third block, two-block glazing bands, white piers and a
// stone base; glowstone behind some panes; a stone-framed entrance with a hanging lantern; a louvred plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_59585950.cells.json`, "utf8"));
const W = 97, D = 65, H = 38;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. per cell: the lidar's ground and roof; storeys from the median 5 x 5 roof, in whole storeys (4 blocks each)
const C = Array.from({ length: W }, () => new Array(D).fill(null));
for (const [x, z, g, r] of cells) C[x][z] = { g, r, n: 1 };
const at = (x, z) => (x >= 0 && x < W && z >= 0 && z < D ? C[x][z] : null);
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const m = at(x + dx, z + dz); if (m) v.push(m.r); }
  v.sort((a, b) => a - b);
  C[x][z].n = Math.min(5, Math.max(1, Math.round((v[v.length >> 1] - 5) / 4)));
}

// 2. mode filter (two passes, own cell weighted up): tiers become flat slabs, not lidar stipple
for (let pass = 0; pass < 2; pass++) {
  const next = [];
  for (const [x, z] of cells) {
    const counts = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const m = at(x + dx, z + dz); if (!m) continue;
      const w = dx === 0 && dz === 0 ? 1.5 : 1;
      counts.set(m.n, (counts.get(m.n) ?? 0) + w);
    }
    let best = 1, bw = -1;
    for (const [n, w] of counts) if (w > bw) { best = n; bw = w; }
    next.push([x, z, best]);
  }
  for (const [x, z, n] of next) C[x][z].n = n;
}

// 3. setbacks: the tower's cells are five storeys, but its outer two cells step back to four (the ring), so the
// core rises above a ring on every side
const depth = new Map();
let queue = [];
for (const [x, z] of cells) {
  if (C[x][z].n !== 5) continue;
  if (NB.some(([dx, dz]) => { const m = at(x + dx, z + dz); return !m || m.n < 5; })) { depth.set(x * D + z, 0); queue.push([x, z]); }
}
for (let d = 0; queue.length; d++) {
  const nxt = [];
  for (const [x, z] of queue) for (const [dx, dz] of NB) {
    const m = at(x + dx, z + dz); if (!m || m.n !== 5 || depth.has((x + dx) * D + z + dz)) continue;
    depth.set((x + dx) * D + z + dz, d + 1); nxt.push([x + dx, z + dz]);
  }
  queue = nxt;
}
for (const [x, z] of cells) if (C[x][z].n === 5 && (depth.get(x * D + z) ?? 99) < 2) C[x][z].n = 4;

// 4. a louvred plant room on the tower's core, centred on it
const core = cells.filter(([x, z]) => C[x][z].n === 5).map(([x, z]) => [x, z]);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
let plant = null;
for (const [sw, sd] of [[16, 10], [12, 8], [10, 6]]) {
  let bestD = Infinity;
  for (let x0 = Math.round(cx - sw / 2) - 6; x0 <= Math.round(cx - sw / 2) + 6; x0++)
    for (let z0 = Math.round(cz - sd / 2) - 6; z0 <= Math.round(cz - sd / 2) + 6; z0++) {
      let ok = true;
      for (let x = x0; x < x0 + sw && ok; x++) for (let z = z0; z < z0 + sd && ok; z++) {
        const m = at(x, z); if (!m || m.n !== 5 || (depth.get(x * D + z) ?? 99) < 2) ok = false;
      }
      const dd = Math.hypot(x0 + sw / 2 - cx, z0 + sd / 2 - cz);
      if (ok && dd < bestD) { bestD = dd; plant = { x0, z0, x1: x0 + sw - 1, z1: z0 + sd - 1 }; }
    }
  if (plant) break;
}
const inPlant = (x, z) => !!plant && x >= plant.x0 && x <= plant.x1 && z >= plant.z0 && z <= plant.z1;
const onPlantEdge = (x, z) => inPlant(x, z) && (x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1);

// 5. helpers. A storey k occupies rows 4+4k (its floor, solid) to 7+4k (air). A cell's air at storey k is facade
// when a neighbour has no air there; the interior behind the glass stays air (no rooms).
const SL = (k) => 4 + 4 * k;
const hasAir = (x, z, k) => { const m = at(x, z); return !!m && k < m.n; };
const faceDirs = (x, z, k) => NB.filter(([dx, dz]) => !hasAir(x + dx, z + dz, k));
const rimAt = (x, z) => NB.some(([dx, dz]) => { const m = at(x + dx, z + dz); return !m || m.n < C[x][z].n; });

// 6. entrance: a ground-floor cell on the broad south-facing wall (outward +z) nearest x = 48, with glass either side
let door = null;
for (const [x, z] of cells) {
  const f = faceDirs(x, z, 0);
  if (f.length !== 1 || f[0][0] !== 0) continue;
  const dz = f[0][1];
  if (!faceDirs(x - 1, z, 0).some(([a, b]) => a === 0 && b === dz) || !faceDirs(x + 1, z, 0).some(([a, b]) => a === 0 && b === dz)) continue;
  if (!door || Math.abs(x - 48) < Math.abs(door.x - 48)) door = { x, z, dz };
}
const doorFacing = door ? (door.dz > 0 ? "north" : "south") : null;

// 7. build
const g = new Voxels([W, H, D]);
const counts = { glass: 0, lit: 0, parapet: 0, plant: 0 };
for (const [x, z] of cells) {
  const c = C[x][z];
  // foundation and base course: solid from y 0 to the ground floor's slab
  for (let y = 0; y < 4; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 4, z, "smooth_stone");
  for (let k = 0; k < c.n; k++) {
    const b = SL(k);
    if (k > 0) g.set(x, b, z, "smooth_stone");                   // floor slab, a band on the facade
    const faces = faceDirs(x, z, k);
    if (!faces.length) continue;                                  // interior: air
    const face = faces[0];
    const u = face[0] !== 0 ? z : x;                              // position along the wall
    const pier = faces.length > 1 || u % 3 === 0;
    const onDoorWall = door && k === 0 && face[1] === door.dz && face[0] === 0;
    const doorU = door ? door.x : -99;
    if (onDoorWall && Math.abs(u - doorU) <= 1 && !(x === door.x && z === door.z)) {
      for (let y = b + 1; y <= b + 3; y++) g.set(x, y, z, "stone_bricks");   // door surround
      continue;
    }
    if (onDoorWall && x === door.x && z === door.z) {
      g.set(x, b + 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });   // lit lintel over the door
      counts.lit++;
      continue;
    }
    g.set(x, b + 1, z, pier ? "white_concrete" : k === 0 ? "stone_bricks" : "light_gray_concrete");   // sill
    for (let y = b + 2; y <= b + 3; y++) {
      if (pier) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass"); counts.glass++;
      // some panes lit from inside: glowstone one cell behind the glass, on the room side
      const inner = [x - face[0], z - face[1]];
      if (hasAir(inner[0], inner[1], k) && faceDirs(inner[0], inner[1], k).length === 0 &&
          ((Math.floor(u / 3) * 7 + k * 5 + (face[0] !== 0 ? 3 : 0) + (y - b)) % 6 === 0)) {
        g.set(inner[0], y, inner[1], "glowstone"); counts.lit++;
      }
    }
  }
  // roof deck at its storey line; a parapet where the roof edges off the footprint or drops (a cornice)
  const top = SL(c.n);
  g.set(x, top, z, "stone");
  if (rimAt(x, z)) { g.set(x, top + 1, z, "white_concrete"); counts.parapet++; }
  if (inPlant(x, z)) {
    for (let y = top + 1; y <= top + 3; y++) {
      const louvre = onPlantEdge(x, z) && y === top + 2;
      g.set(x, y, z, y === top + 3 ? "smooth_stone" : louvre ? "iron_bars" : "light_gray_concrete");
    }
    counts.plant++;
  }
}

const out = g.save(`${DIR}/way_59585950.nbt`);
console.log(JSON.stringify({ cells: cells.length, storeys: [1, 2, 3, 4, 5].map((n) => cells.filter(([x, z]) => C[x][z].n === n).length), plant, door, ...counts, ...out }));
