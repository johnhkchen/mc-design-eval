import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001561.cells.json`, "utf8"));

const W = 6, H = 24, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, roof] of cells) info.set(key(x, z), { x, z, gr, roof });
const inF = (x, z) => info.has(key(x, z));
const grOf = (x, z) => info.get(key(x, z)).gr;

// Distance from the outside: edge cells = 1, growing inward
const dist = new Map();
const queue = [];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const c of info.values()) {
  const edge = NB.some(([dx, dz]) => !inF(c.x + dx, c.z + dz));
  if (edge) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const nx = c.x + dx, nz = c.z + dz;
    const k = key(nx, nz);
    if (inF(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push(info.get(k));
    }
  }
}
const Dof = (x, z) => dist.get(key(x, z)) ?? 0;

// One clean massing for the whole block: roof ~12 above the lowest ground
const gMin = Math.min(...[...info.values()].map(c => c.gr));
const gMax = Math.max(...[...info.values()].map(c => c.gr));
let WT = Math.max(gMin + 10, gMax + 5);     // top of the walls (shared line)
if (WT + 2 >= H) WT = H - 3;
const SH = Math.max(3, Math.floor((WT - gMin) / 3));  // storey height, shared

const isBelt = (y) => {
  if (y <= gMin || y >= WT) return false;
  const r = y - gMin;
  return r % SH === 0 && r / SH <= 3;
};
const storeyOf = (y) => Math.floor((y - gMin - 1) / SH) + 1;

function faceOf(x, z) {
  if (z === 0) return { f: "front", out: [0, -1] };
  if (z === D - 1) return { f: "back", out: [0, 1] };
  if (x === 0) return { f: "side", out: [-1, 0] };
  if (x === W - 1) return { f: "side", out: [1, 0] };
  return { f: "side", out: [0, 0] };
}

function isWin(f, x, z, s) {
  if (f === "front") return s === 1 ? (x === 1 || x === 4) : (x >= 1 && x <= 4);
  if (f === "back") return x >= 1 && x <= 4;
  return z % 2 === 1 && z >= 1 && z <= D - 2;
}

for (const c of info.values()) {
  const { x, z, gr } = c;
  const d = Dof(x, z);

  // Foundation up to this cell's own ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  if (d === 1) {
    const { f, out } = faceOf(x, z);
    for (let y = gr + 1; y <= WT; y++) {
      // Entrance: a dark oak door on the front, centred in the ground bay
      if (f === "front" && x === 2 && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      let id = "bricks";
      if (y === WT || isBelt(y)) {
        id = "white_concrete";
      } else {
        const s = storeyOf(y);
        const lo = gMin + (s - 1) * SH + 1;
        const hi = gMin + s * SH - 1;
        if (s <= 3 && y >= lo && y <= hi && isWin(f, x, z, s)) id = "glass";
      }
      g.set(x, y, z, id);
    }

    // Cornice cap
    if (WT + 1 < H) g.set(x, WT + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // Warm light just inside selected bays
    for (let s = 1; s <= 3; s++) {
      const lo = gMin + (s - 1) * SH + 1;
      if (lo <= gr || lo >= WT) continue;
      if (!isWin(f, x, z, s)) continue;
      if ((x + z + s) % 3 !== 0) continue;
      const ix = x - out[0], iz = z - out[1];
      if (inF(ix, iz) && Dof(ix, iz) >= 2 && lo > grOf(ix, iz)) {
        g.set(ix, lo, iz, "glowstone");
      }
    }
  } else {
    // Interior: air gap, with a floor/ceiling slab at each storey line and at the top
    for (let y = gr + 1; y <= WT; y++) {
      if (y === WT || isBelt(y)) g.set(x, y, z, "oak_planks");
    }
  }

  // Roof: one shallow hip. Ring of stairs sloping in from the cornice, cubes at the ridge.
  if (d === 2) {
    let best = null;
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (inF(nx, nz) && Dof(nx, nz) > 2) {
        if (!best || Dof(nx, nz) > Dof(best.nx, best.nz)) best = { nx, nz, dx, dz };
      }
    }
    if (best) {
      const facing = best.dx === 1 ? "east" : best.dx === -1 ? "west" : best.dz === 1 ? "south" : "north";
      g.set(x, WT + 1, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      g.set(x, WT + 1, z, "deepslate_tiles");
    }
  } else if (d >= 3) {
    g.set(x, WT + 1, z, "deepslate_tiles");
  }
}

// Brick chimney on the ridge, standing on a full roof cube
if (inF(3, 4) && Dof(3, 4) >= 3) {
  for (let y = WT + 2; y <= WT + 4 && y < H; y++) g.set(3, y, 4, "bricks");
}

// Entrance step just inside the door (only where that interior cell is open)
if (inF(2, 1) && inF(2, 0)) {
  const yStep = grOf(2, 0) + 1;
  if (yStep > grOf(2, 1) && yStep < WT) {
    g.set(2, yStep, 1, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3001561.nbt`);
