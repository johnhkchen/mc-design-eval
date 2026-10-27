import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 8 Nugent Street (Grafton): a 1970s concrete-framed office block. Cream precast panels, tinted curtain glass in
// ribbon bands, light-grey fins and spandrels, a stone plinth that carries the downhill shop row, five storeys on one
// floor grid (y 6, 10, ... 22) with setbacks down to the wings, and a plant room on the centre roof.
const ROOT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${ROOT}/way_269465548.cells.json`, "utf8"));
const OUT = `${ROOT}/way_269465548.nbt`;

const X = 96, Y = 41, Z = 51;
const D = 6;            // the ground-floor slab: 6 blocks above the lowest ground
const STOREY = 4;

const BODY = "white_concrete", TRIM = "light_gray_concrete", PLINTH = "stone_bricks", ROOF = "gray_concrete";
const TINT = "light_blue_stained_glass_pane", CLEAR = "glass_pane", BARS = "iron_bars";
const SOLID = new Set([BODY, TRIM, PLINTH, ROOF]);
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roofAt = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); roofAt.set(key(x, z), r); }
const inFp = (x, z) => ground.has(key(x, z));
// a footprint cell whose neighbour in direction d is outside: an exterior face
const faceAt = (x, z, d) => inFp(x, z) && !inFp(x + d.dx, z + d.dz);
const hash = (x, z, k) => ((x * 73856093) ^ (z * 19349663) ^ (k * 83492791)) >>> 0;
const short = (b) => b.replace(/^minecraft:/, "");

// the lidar's roof height -> one flat tier on the storey grid; 27-28 is the plant room over the 26 roof
const topOf = (r) => (r >= 27 ? 28 : D + Math.min(5, Math.max(1, Math.round((r - D) / STOREY))) * STOREY);

// the entrance goes on the exterior face whose ground is lowest (the street side), at its middle
let entrance = null;
{
  let best = Infinity;
  for (const d of DIRS) {
    const cs = [...ground.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => faceAt(x, z, d));
    if (cs.length < 8) continue;
    const avg = cs.reduce((a, [x, z]) => a + ground.get(key(x, z)), 0) / cs.length;
    if (avg >= best) continue;
    best = avg;
    const along = d.dz ? 0 : 1;                         // index into [x, z] that runs along the face
    cs.sort((a, b) => a[along] - b[along]);
    const mid = cs[cs.length >> 1];
    const [sx, sz] = d.dz ? [1, 0] : [0, 1];
    const three = [-1, 0, 1].map((o) => [mid[0] + o * sx, mid[1] + o * sz]).filter(([x, z]) => faceAt(x, z, d));
    entrance = { d, door: mid, cells: three };
  }
}
const isEntrance = (x, z) => entrance && entrance.cells.some(([ex, ez]) => ex === x && ez === z);

// the lidar's roof is noisy: each cell takes the median roof height within 4 cells, so the tiers come out flat
const R = 4, roofSm = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), vals = [];
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) if (inFp(x + a, z + b)) vals.push(roofAt.get(key(x + a, z + b)));
  vals.sort((p, q) => p - q);
  roofSm.set(k, vals[vals.length >> 1]);
}

const g = new Voxels([X, Y, Z]);
const top = new Map();
const panes = [];           // [x, y, z, block] of glass and bars, so their connections are set at the end

// Pass 1: the solid massing from y 0 up to each cell's tier (foundation and plinth included), roof membrane on top.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const t = topOf(roofSm.get(k));
  top.set(k, t);
  const perim = DIRS.some((d) => faceAt(x, z, d));
  for (let y = 0; y < t; y++) {
    let b = BODY;
    if (perim && y < D) b = PLINTH;
    if (y === t - 1) b = ROOF;
    g.set(x, y, z, b);
  }
}

// Pass 2: facade articulation on every exterior face (spandrels, fins, glass bands, air behind the glass).
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const t = top.get(k), plant = roofSm.get(k) >= 27;
  const d = DIRS.find((dd) => faceAt(x, z, dd));
  if (!d) {
    // interior roof: AC units on the 26 roof now and then (a 2 by 2 box, all four cells on the same roof)
    if (!plant && t === D + 20 && hash(x, z, 1) % 61 === 0) {
      const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
      if (sq.every(([a, b]) => inFp(a, b) && top.get(key(a, b)) === t && !DIRS.some((dd) => faceAt(a, b, dd)))) {
        for (const [a, b] of sq) g.set(a, t, b, TRIM);
      }
    }
    continue;
  }

  const s = d.dz ? x : z;                                // position along the face
  // a fin every 4 cells along the face (the stepped faces are convex corners on nearly every cell, so no corner rule)
  const pier = s % 4 === 0;
  const ix = x - d.dx, iz = z - d.dz;                    // the cell behind the glass
  const pocket = inFp(ix, iz);
  const glass = (y, block) => { g.set(x, y, z, block); panes.push([x, y, z, block]); if (pocket) g.set(ix, y, iz, "air"); };

  {
    const nS = plant ? 5 : (t - D) / STOREY;             // the plant room stands on five storeys too
    for (let kk = 0; kk < nS; kk++) {
      const F = D + kk * STOREY;
      const ground0 = kk === 0, last = F + STOREY >= t;
      const winTop = ground0 || last ? F + 2 : F + 3;     // the window band's top row
      g.set(x, F, z, TRIM);                               // spandrel: the storey line
      for (let y = F + 1; y <= winTop; y++) {
        if (pier) g.set(x, y, z, TRIM);
        else glass(y, ground0 ? CLEAR : TINT);
      }
      if (winTop < F + 3) g.set(x, F + 3, z, TRIM);       // head band under the next floor or the cornice
      if (!pier && !isEntrance(x, z)) {
        // warm lights behind some of the glass: shroomlights up top, glowstone in the shop row
        if (!ground0 && winTop >= F + 2 && hash(x, z, kk) % 7 === 0 && pocket) g.set(ix, F + 2, iz, "shroomlight");
        if (ground0 && hash(x, z, 9) % 3 === 0 && pocket) g.set(ix, 7, iz, "glowstone");
      }
    }
    if (plant) {
      // the plant room's louvres (iron bars) over its last two rows
      for (const y of [t - 2, t - 1]) {
        if (s % 2 === 0) { g.set(x, y, z, BARS); panes.push([x, y, z, BARS]); } else g.set(x, y, z, TRIM);
      }
    } else {
      // the cornice: a parapet course on the roof edge
      g.set(x, t, z, TRIM);
      // a low band of shop glass on the downhill side, where the plinth stands clear of the ground
      if (ground.get(k) <= 1 && !pier) {
        g.set(x, 1, z, TRIM);
        glass(2, CLEAR); glass(3, CLEAR);
        g.set(x, 4, z, TRIM);
      }
    }
  }
}

// the entrance: a door in a 3-wide recess, shopfront glass either side, a hanging lantern under a canopy
if (entrance) {
  const { d, door, cells: ec } = entrance;
  for (const [x, z] of ec) {
    const ix = x - d.dx, iz = z - d.dz;
    for (let y = D; y <= D + 2; y++) if (inFp(ix, iz)) g.set(ix, y, iz, "air");
  }
  for (const [x, z] of ec) {
    if (x === door[0] && z === door[1]) {
      const st = { facing: OPP[d.name], hinge: "left", open: "false", powered: "false" };
      g.set(x, D, z, "dark_oak_door", { ...st, half: "lower" });
      g.set(x, D + 1, z, "dark_oak_door", { ...st, half: "upper" });
      g.set(x, D + 2, z, CLEAR); panes.push([x, D + 2, z, CLEAR]);
      const ix = x - d.dx, iz = z - d.dz;
      if (inFp(ix, iz)) g.set(ix, D + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      g.set(x, D, z, TRIM);
      for (const y of [D + 1, D + 2]) { g.set(x, y, z, CLEAR); panes.push([x, y, z, CLEAR]); }
    }
  }
}

// pane and bar connections: each side joins a neighbour that is solid, glass or bars, as in the game
const connects = (name) => SOLID.has(name) || name === TINT || name === CLEAR || name === BARS;
for (const [x, y, z, block] of panes) {
  const st = { waterlogged: "false" };
  for (const [name, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]]) {
    const nb = g.get(x + dx, y, z + dz);
    st[name] = nb && connects(short(nb.block)) ? "true" : "false";
  }
  g.set(x, y, z, block, st);
}

const stats = g.save(OUT);
console.log(`way_269465548: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
