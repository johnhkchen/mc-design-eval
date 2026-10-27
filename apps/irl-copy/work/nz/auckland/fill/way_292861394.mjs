// A 1970s concrete-frame office block on a stone base, the Newton / Eden Terrace kind: a 13-storey tower of 4-block
// storeys (roof at 52, one flat lidar tier across its footprint), lower wings stepping down to their lidar roofs, tinted
// glass between white concrete piers, a shopfront base on the ground floor and a recessed entrance on the south side.
// Each column stands on its own ground (stone foundation to y = ground), so the downhill side shows its extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861394.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([33, 65, 25]);

const k = (x, z) => `${x},${z}`;
const TOWER_ROOF = 52;                                  // the lidar's flat tower tier (370 of 479 cells at 52)
const col = new Map(cells.map(([x, z, gr, r]) => {
  const tower = r >= 40;                                // lidar roofs >= 40 are the tower; lower ones are wings
  const top = tower ? TOWER_ROOF : Math.max(gr + 4, Math.max(4, Math.round(r / 4) * 4));   // wing tiers on whole storeys
  return [k(x, z), { x, z, gr, r, tower, top }];
}));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const nb = (c, dx, dz) => col.get(k(c.x + dx, c.z + dz));
// the sides on which the air is open at height y: outside the footprint, or the neighbour's roof is below y
const airSides = (c, y) => DIRS.filter(([, dx, dz]) => { const n = nb(c, dx, dz); return !n || y >= n.top; });

// the entrance: the south-facing edge nearest the middle of the footprint, at least 8 blocks tall
const southEdge = [...col.values()].filter((c) => !nb(c, 0, 1) && c.top >= c.gr + 8);
const ent = southEdge.sort((a, b) => Math.abs(a.x - 16) - Math.abs(b.x - 16))[0];
const entKeys = new Set([-1, 0, 1].map((d) => k(ent.x + d, ent.z)).filter((key) => col.has(key)));

const lamps = [];                                       // glass windows that may get a warm light just behind them
const glassFor = (b, s) => ((b + s) % 4 === 0 ? "light_blue_stained_glass" : "gray_stained_glass");   // tinted curtain wall
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const c of col.values()) {
  // foundation: solid from y 0 up to this column's ground
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, y === 0 ? "polished_andesite" : "stone_bricks");

  for (let y = c.gr; y < c.top; y++) {
    const sides = airSides(c, y), top = y === c.top - 1;
    if (!top && sides.length === 0) {                   // interior: air behind the glass, one floor slab per storey
      if ((y - c.gr) % 4 === 0) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }
    if (top) { g.set(c.x, y, c.z, sides.length ? "stone_bricks" : "smooth_stone"); continue; }   // parapet / roof
    if (y === c.top - 2) { g.set(c.x, y, c.z, "polished_andesite"); continue; }                  // cornice course

    const r = y - c.gr, m = r % 4, s = Math.floor(r / 4);
    const corner = sides.length > 1;
    const [, dx, dz] = sides[0];
    const u = dz !== 0 ? c.x : c.z;                     // along-face coordinate for the bays
    const b = Math.floor(u / 3), pier = corner || u % 3 === 0;

    if (ent && entKeys.has(k(c.x, c.z)) && sides.some(([n]) => n === "S") && r <= 2) {
      if (c.x === ent.x && r <= 1) g.set(c.x, y, c.z, "dark_oak_door", doorState(r === 0 ? "lower" : "upper"));
      else if (r === 0) g.set(c.x, y, c.z, "polished_andesite");
      else g.set(c.x, y, c.z, "light_blue_stained_glass");
      continue;
    }
    if (s === 0 && m === 0) { g.set(c.x, y, c.z, "polished_andesite"); continue; }   // base course
    if (m === 0 || m === 3) { g.set(c.x, y, c.z, "light_gray_concrete"); continue; }  // floor band, spandrel
    if (pier) { g.set(c.x, y, c.z, "white_concrete"); continue; }                    // concrete frame
    g.set(c.x, y, c.z, glassFor(b, s));
    if (((u * 5 + y * 3 + c.z * 7) % 7) === 0) lamps.push([c.x, y, c.z, dx, dz]);
  }
}

// warm light behind some windows: only into air (the interior behind the glass)
for (const [x, y, z, dx, dz] of lamps) {
  const ix = x - dx, iz = z - dz, n = col.get(k(ix, iz));
  if (n && y >= n.gr && y < n.top - 1 && g.get(ix, y, iz) === null) g.set(ix, y, iz, "glowstone");
}

// rooftop plant: two boxes on the tower's roof, inside its outline (at least 4 blocks in from the edge)
const tower = [...col.values()].filter((c) => c.tower);
const depth = new Map(), queue = [];
for (const c of tower) if (DIRS.some(([, dx, dz]) => !(nb(c, dx, dz)?.tower))) { depth.set(k(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(k(c.x, c.z));
  for (const [, dx, dz] of DIRS) { const n = nb(c, dx, dz); if (n?.tower && !depth.has(k(n.x, n.z))) { depth.set(k(n.x, n.z), d + 1); queue.push(n); } }
}
const core = (x, z) => (depth.get(k(x, z)) ?? 0) >= 4;
const boxAt = (x0, z0) => { for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) if (!core(x, z)) return false; return true; };
const coreCells = tower.filter((c) => core(c.x, c.z));
const cx = coreCells.reduce((a, c) => a + c.x, 0) / coreCells.length, cz = coreCells.reduce((a, c) => a + c.z, 0) / coreCells.length;
const boxes = [];
for (const c of coreCells.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))) {
  if (boxes.length >= 2) break;
  if (!boxAt(c.x, c.z) || boxes.some(([bx, bz]) => Math.abs(bx - c.x) < 6 && Math.abs(bz - c.z) < 4)) continue;
  boxes.push([c.x, c.z]);
}
for (const [x0, z0] of boxes) for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) {
  g.set(x, TOWER_ROOF, z, "light_gray_concrete");
  g.set(x, TOWER_ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_292861394.nbt`);
console.log(JSON.stringify({ cells: cells.length, entrance: [ent.x, ent.z], plant: boxes, ...stats }));
