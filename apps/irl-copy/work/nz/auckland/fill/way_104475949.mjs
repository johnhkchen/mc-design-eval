// WD Building (Auckland CBD, way 104475949): a 1960s-70s concrete-frame office block, six storeys on a
// stepped roof (lidar tops 22-25 above y0), white concrete piers and light-blue glass bays on 4-block storeys,
// a stone ground storey with a shopfront, a dark lintel entrance, a stone parapet and a rooftop plant core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475949.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475949.nbt";
const SX = 71, SY = 38, SZ = 29;
const STOREY = 4;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));       // [x, z, ground, roof]
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const F = (x, z) => fp.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const KEY = (x, y, z) => `${x},${y},${z}`;

// Storeys per cell from the lidar roof (top = 4n + 1 with the parapet), then a majority vote over the 3x3
// footprint neighbourhood so the lidar noise becomes flat tiers.
const rawN = (r) => Math.min(6, Math.max(2, Math.round((r - 1) / STOREY)));
const nOf = new Map();
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const cnt = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n2 = F(x + dx, z + dz); if (!n2) continue;
    const n = rawN(n2.r); cnt.set(n, (cnt.get(n) || 0) + 1);
  }
  let best = rawN(c.r), bc = cnt.get(best) || 0;
  for (const [n, v] of cnt) if (v > bc) { best = n; bc = v; }
  nOf.set(k, best);
}
const G = (x, z) => F(x, z).g;
const CAP = (x, z) => STOREY * nOf.get(`${x},${z}`);       // roof slab level; parapet sits on it
const MAXCAP = Math.max(...[...fp.keys()].map((k) => { const [x, z] = k.split(",").map(Number); return CAP(x, z); }));

// A block at (x, y, z) is envelope when it lies inside the footprint between its ground and its roof.
// A side face is exposed when the neighbour there is open air: outside the footprint above our ground, or a
// neighbour whose roof is lower (a setback). A neighbour's ground is solid, so it never exposes a face.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz, c = F(nx, nz);
  if (!c) return y >= G(x, z);
  if (y < c.g) return false;
  return y > CAP(nx, nz);
});
const parapetHere = (x, z) => DIRS.some(([dx, dz]) => { const c = F(x + dx, z + dz); return !c || CAP(x + dx, z + dz) < CAP(x, z); });
const inside = (x, z, y) => { const c = F(x, z); return !!c && y >= c.g && y <= CAP(x, z); };

const B = new Map();
const put = (x, y, z, block, state) => B.set(KEY(x, y, z), { block, state, x, y, z });
const FULL = new Set(["white_concrete", "polished_andesite", "light_gray_concrete", "black_concrete", "stone_bricks", "smooth_stone"]);
const panes = [];

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const cap = CAP(x, z);
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");                     // foundation under the ground
  for (let y = c.g; y <= cap; y++) {
    const p = y % STOREY;
    if (y === cap) { put(x, y, z, "smooth_stone"); continue; }                    // roof slab
    const ex = exposed(x, z, y);
    if (p === 0) {                                                                  // floor slab per storey; base course at grade
      put(x, y, z, y === 0 && ex.length ? "polished_andesite" : "light_gray_concrete");
      continue;
    }
    if (y === c.g && ex.length) { put(x, y, z, "polished_andesite"); continue; }    // plinth where the ground steps
    if (!ex.length) continue;                                                       // air gap behind the glass
    const corner = ex.some(([dx]) => dx !== 0) && ex.some(([, dz]) => dz !== 0);
    const [dx] = ex[0];
    const u = dx !== 0 ? z : x;                                                     // along-wall coordinate
    if (p === 3) { put(x, y, z, "white_concrete"); continue; }                      // head band
    const ground = y < STOREY;
    if (corner || u % 3 === 0) { put(x, y, z, ground ? "polished_andesite" : "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", null);
    panes.push({ x, y, z, ex: ex[0] });
  }
  // parapet stands on the roof slab at the edge (and on a step down)
  if (parapetHere(x, z)) put(x, cap + 1, z, "stone_bricks");
}

// Entrance: a ground-storey bay on a south-facing wall at grade, one bay in from the pier, under a dark lintel.
const doorCands = panes.filter((p) => p.y === 1 && F(p.x, p.z).g === 0);
const doorOk = (p) => {
  const [dx, dz] = p.ex;
  const u = dx !== 0 ? p.z : p.x;
  if (u % 3 !== 1) return false;
  const side = (s) => dx !== 0 ? [p.x, p.y, p.z + s] : [p.x + s, p.y, p.z];
  return [-1, 1].every((s) => { const q = side(s); const b = B.get(KEY(...q)); return b && (b.block === "white_concrete" || b.block === "light_blue_stained_glass_pane" || b.block === "polished_andesite"); })
    && !(B.get(KEY(p.x, p.y, p.z)).block === "polished_andesite");
};
const southCands = doorCands.filter((p) => p.ex[0] === 0 && p.ex[1] === 1 && doorOk(p));
const anyCands = doorCands.filter(doorOk);
const pool = southCands.length ? southCands : anyCands;
const door = pool.sort((a, b) => Math.abs(a.x - 35) - Math.abs(b.x - 35))[0];
if (door) {
  const [dx, dz] = door.ex;
  const u = dx !== 0 ? door.z : door.x;
  const facing = DNAME[`${dx},${dz}`];
  const sideAt = (s, y) => dx !== 0 ? [door.x, y, door.z + s] : [door.x + s, y, door.z];
  for (const y of [1, 2]) {
    put(door.x, y, door.z, "dark_oak_door", { facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  }
  for (const s of [-1, 0, 1]) { const [x, y, z] = sideAt(s, 3); put(x, y, z, "black_concrete"); }
  const [lx, ly, lz] = sideAt(1, 2);
  put(lx, ly, lz, "lantern", { hanging: "true", waterlogged: "false" });
  const [lx2, ly2, lz2] = sideAt(-1, 2);
  put(lx2, ly2, lz2, "lantern", { hanging: "true", waterlogged: "false" });
  console.log("entrance", facing, door.x, door.z);
}

// Warm glow: some panes on the upper storeys lit from the air gap behind them.
for (const p of panes) {
  if (p.y % STOREY !== 1 && p.y % STOREY !== 2) continue;
  if ((p.x * 7 + p.z * 3 + p.y * 11) % 9 !== 0) continue;
  const [dx, dz] = p.ex;
  const ix = p.x - dx, iz = p.z - dz;
  if (!inside(ix, iz, p.y) || exposed(ix, iz, p.y).length) continue;
  if (B.has(KEY(ix, p.y, iz))) continue;
  put(ix, p.y, iz, "glowstone");
}

// Panes join the frames and piers in their own wall plane only.
const N = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const p of panes) {
  const b = B.get(KEY(p.x, p.y, p.z));
  if (!b || b.block !== "light_blue_stained_glass_pane") continue;
  const inPlane = p.ex[0] !== 0 ? ["north", "south"] : ["east", "west"];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const d of inPlane) {
    const [ox, oz] = N[d];
    const nb = B.get(KEY(p.x + ox, p.y, p.z + oz));
    if (nb && (FULL.has(nb.block) || nb.block === "light_blue_stained_glass_pane")) state[d] = "true";
  }
  b.state = state;
}

// Rooftop plant: a solid 4 x 3 core on the top tier, two blocks high, set well inside the roof edge.
let core = null;
for (const [k] of fp) {
  const [x0, z0] = k.split(",").map(Number);
  const cells2 = [];
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) cells2.push([x0 + dx, z0 + dz]);
  const ok = cells2.every(([x, z]) => F(x, z) && CAP(x, z) === MAXCAP
    && DIRS.every(([a, b]) => F(x + a, z + b) && CAP(x + a, z + b) === MAXCAP));
  if (ok) { core = { x0, z0 }; break; }
}
if (core) {
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = core.x0 + dx, z = core.z0 + dz;
    put(x, MAXCAP + 1, z, "white_concrete");
    put(x, MAXCAP + 2, z, "light_gray_concrete");
  }
}

const vox = new Voxels([SX, SY, SZ]);
for (const b of B.values()) {
  if (b.x < 0 || b.x >= SX || b.y < 0 || b.y >= SY || b.z < 0 || b.z >= SZ) continue;
  vox.set(b.x, b.y, b.z, b.block, b.state ?? undefined);
}
const res = vox.save(OUT);
console.log("saved", OUT, res, "top", MAXCAP + (core ? 2 : 1), "cells", fp.size, "panes", panes.length);
