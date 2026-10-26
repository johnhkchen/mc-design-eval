import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC78548";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 32, D = 29;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  map.set(key(x, z), {
    g: Math.max(0, Math.round(gr)),
    r: Math.min(H - 6, Math.max(0, Math.round(rf))),
  });
}
const has = (x, z) => map.has(key(x, z));

// Depth from exterior: 0 = perimeter, 1 = second ring, ...
const depth = new Map();
const queue = [];
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  if (edge) { depth.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    const nk = key(nx, nz);
    if (has(nx, nz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}

const isPier = (x, z) => (x + z) % 3 === 0;

const GLASS = "light_blue_stained_glass";
const SPANDREL = "white_concrete";
const PIER = "light_gray_concrete";
const CORE = "white_concrete";
const BASE = "polished_granite";
const CORNICE = "stone_bricks";
const FOUND = "stone";

// Entrance cell on the street face (z = 0)
const DOOR_X = 7;

for (const [k, { g: gr, r }] of map) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 0;
  const T = Math.min(H - 4, Math.max(gr + 4, r));

  // Foundation from y0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const isEntry = z === 0 && Math.abs(x - DOOR_X) <= 1;

  for (let y = gr; y < T; y++) {
    const rel = y - gr;

    // Roof cap / top course
    if (y === T - 1) {
      g.set(x, y, z, d <= 1 ? CORNICE : PIER);
      continue;
    }

    if (d === 0) {
      // Entrance bay: door, lintel above, flanking stone piers
      if (isEntry && rel <= 3) {
        if (x === DOOR_X && rel === 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (x === DOOR_X && rel === 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (rel === 3) {
          // Lintel course over the door
          g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
          continue;
        }
        if (rel === 0) {
          g.set(x, y, z, BASE);
          continue;
        }
        // Flanking bays: stone jambs
        if (x !== DOOR_X) {
          g.set(x, y, z, CORNICE);
          continue;
        }
      }

      let block;
      if (rel === 0) block = BASE;
      else if (rel % 4 === 0) block = SPANDREL;
      else if (isPier(x, z)) block = PIER;
      else block = GLASS;
      g.set(x, y, z, block);
    } else if (d === 1) {
      // Second ring: solid at bands/piers, air gap behind glazing
      const band = rel === 0 || rel % 4 === 0;
      if (band || isPier(x, z)) {
        g.set(x, y, z, PIER);
      } else if (rel % 4 === 2 && !isPier(x, z) && ((x * 5 + y * 7) % 13 === 0)) {
        // Warm light behind a window, at mid-storey height only
        g.set(x, y, z, "glowstone");
      }
    } else {
      g.set(x, y, z, CORE);
    }
  }

  // Parapet on the perimeter
  if (d === 0 && T < H - 2) {
    g.set(x, T, z, CORNICE);
  }

  // Roof equipment on the interior roof
  if (d >= 3 && T < H - 3 && x % 5 === 2 && z % 6 === 3) {
    g.set(x, T, z, "stone_bricks");
    g.set(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
