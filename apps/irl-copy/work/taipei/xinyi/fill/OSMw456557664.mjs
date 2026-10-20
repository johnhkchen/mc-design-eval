import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 20, H = 33, D = 18;
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557664";
const ROOF = 20;      // top roof slab layer; parapet sits at ROOF + 1
const PARAPET = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const gMin = Math.min(...cells.map(c => c[2]));
const G = new Map();
for (const [x, z, gr] of cells) {
  const g = Math.min(12, Math.max(0, Math.round(gr - gMin)));
  G.set(key(x, z), g);
}
const inS = (x, z) => G.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance-from-outside: 1 = facade shell, 2 = light-well cavity, >=3 = solid core.
const dist = new Map();
const queue = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB4.some(([dx, dz]) => !inS(x + dx, z + dz))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB4) {
    const nk = key(x + dx, z + dz);
    if (G.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

// Mullion/pillar test on facade cells: corners always, otherwise every third bay.
function isPillar(x, z) {
  const xFace = !inS(x - 1, z) || !inS(x + 1, z);
  const zFace = !inS(x, z - 1) || !inS(x, z + 1);
  if (xFace && zFace) return true;
  if (zFace) return x % 3 === 0;
  if (xFace) return z % 3 === 0;
  return false;
}

// Entrance: a north-facing (z-min) shell cell near the middle of the front.
let entrance = null;
{
  const front = [];
  for (const [k, g] of G) {
    const [x, z] = k.split(",").map(Number);
    if (dist.get(k) === 1 && !inS(x, z - 1)) front.push([x, z, g]);
  }
  if (front.length) {
    const zMin = Math.min(...front.map(f => f[1]));
    const row = front.filter(f => f[1] === zMin).sort((a, b) => a[0] - b[0]);
    entrance = row[Math.floor(row.length / 2)];
  }
}

const g = new Voxels([W, H, D]);

for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k);

  // Foundation under every footprint cell up to its ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  if (d === 1) {
    // Facade shell from ground to parapet.
    for (let y = ground; y <= PARAPET; y++) {
      let id;
      if (y === PARAPET) {
        id = "white_concrete";                          // parapet
      } else if (y === ROOF) {
        id = "light_gray_concrete";                     // roof edge band
      } else if (y === ground) {
        id = "stone_bricks";                            // base course
      } else if (y < 5) {
        // Ground storey: shopfront, lintel at y = 4.
        if (y === 4) id = "light_gray_concrete";
        else if (isPillar(x, z)) id = "light_gray_concrete";
        else id = "glass_pane";
      } else if (y % 5 === 0) {
        id = "light_gray_concrete";                     // storey line
      } else if (y % 5 === 4) {
        id = "white_concrete";                          // spandrel
      } else {
        id = isPillar(x, z) ? "light_gray_concrete" : "light_blue_stained_glass_pane";
      }
      g.set(x, y, z, id);
    }
  } else if (d === 2) {
    // Light well behind the glass: air, with floor slabs and some warm lamps.
    g.set(x, ground, z, "light_gray_concrete");
    for (let y = ground + 1; y <= ROOF; y++) {
      if (y % 5 === 0 || y === ROOF) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }
      const wallNb = NB4.map(([dx, dz]) => [x + dx, z + dz])
        .find(([nx, nz]) => inS(nx, nz) && dist.get(key(nx, nz)) === 1);
      if (wallNb && !isPillar(wallNb[0], wallNb[1]) && y % 5 >= 1 && y % 5 <= 3 && (x + z) % 3 === 0) {
        g.set(x, y, z, "glowstone");
      }
    }
  } else {
    // Solid core.
    for (let y = ground; y <= ROOF; y++) g.set(x, y, z, "light_gray_concrete");
    // Roof plant on the core.
    if (x % 6 === 3 && z % 6 === 3) {
      g.set(x, PARAPET, z, "stone");
      g.set(x, PARAPET + 1, z, "light_gray_concrete");
    }
  }
}

// Entrance doorway in the shopfront.
if (entrance) {
  const [ex, ez, eg] = entrance;
  const lo = eg + 1, hi = eg + 2;
  g.set(ex, lo, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, hi, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
