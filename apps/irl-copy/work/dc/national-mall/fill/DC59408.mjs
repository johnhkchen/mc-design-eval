import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1201 F St NW, Commercial-Office-Large. 1960s-70s Federal Triangle-edge office block:
// pale limestone-clad piers, blue-grey ribbon glazing, a granite base, a cornice and
// parapet, a recessed central entrance under a canopy, and a stepped mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC59408";
const W = 22, D = 18, H = 32;
const TOP_MAX = 28;
const GROUND_MAX = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const c of cells) {
  const gy = Math.min(Math.max(0, Math.round(c[2] ?? 0)), GROUND_MAX);
  const roof = Number.isFinite(c[3]) ? c[3] : gy + 8;
  cmap.set(key(c[0], c[1]), { x: c[0], z: c[1], gy, roof });
}

const all = [...cmap.values()];
const B = Math.min(...all.map((c) => c.gy));
const minX = Math.min(...all.map((c) => c.x));
const maxX = Math.max(...all.map((c) => c.x));
const minZ = Math.min(...all.map((c) => c.z));
const maxZ = Math.max(...all.map((c) => c.z));

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [0, 0]];

// Distance from the outside edge (0 = facade, 1 = first ring, ...).
const isEdgeCell = (c) =>
  c.x === minX || c.x === maxX || c.z === minZ || c.z === maxZ ||
  NB4.some(([dx, dz]) => !cmap.has(key(c.x + dx, c.z + dz)));

const dist = new Map();
const queue = [];
for (const c of all) {
  if (isEdgeCell(c)) {
    dist.set(key(c.x, c.z), 0);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB4) {
    const k = key(c.x + dx, c.z + dz);
    const n = cmap.get(k);
    if (n && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push(n);
    }
  }
}
for (const c of all) if (!dist.has(key(c.x, c.z))) dist.set(key(c.x, c.z), 2);

// Massing: one dominant roof tier, quantised to storeys (2 blocks), with only
// strong deviations kept as real steps. This removes the lidar stair-noise.
const roofs = all.map((c) => c.roof).sort((a, b) => a - b);
const T0 = Math.round(roofs[Math.floor(roofs.length / 2)]);
for (const c of all) {
  let T = Math.abs(c.roof - T0) <= 3
    ? T0
    : B + 2 * Math.round((c.roof - B) / 2);
  T = Math.min(Math.max(T, c.gy + 6), TOP_MAX);
  c.T = T;
}

// Entrance on the street face (minZ), centred on the face.
const faceXs = all.filter((c) => c.z === minZ).map((c) => c.x).sort((a, b) => a - b);
const midX = faceXs[Math.floor(faceXs.length / 2)];
const doorXs = [midX - 1, midX].filter((x) => faceXs.includes(x));
const canopyXs = [midX - 2, midX - 1, midX, midX + 1, midX + 2].filter((x) => faceXs.includes(x));
const ge = cmap.get(key(midX, minZ))?.gy ?? B;

const g = new Voxels([W, H, D]);

function facade(c, y) {
  const { x, z, gy, T } = c;
  if (y === gy) return ["polished_granite"];
  if (y === T - 1) return ["quartz_block"]; // cornice course
  const L = y - B;
  if (L % 2 === 0) return ["smooth_quartz"]; // spandrel / floor line
  const hasX = !cmap.has(key(x - 1, z)) || !cmap.has(key(x + 1, z));
  const hasZ = !cmap.has(key(x, z - 1)) || !cmap.has(key(x, z + 1));
  if (hasX && hasZ) return ["quartz_block"]; // corner pier
  const u = hasZ ? x : z; // along-face coordinate
  if (u % 3 === 0) return ["quartz_block"]; // mullion
  return ["light_blue_stained_glass"];
}

// Main massing pass.
for (const c of all) {
  const d = dist.get(key(c.x, c.z));
  for (let y = 0; y < c.gy; y++) g.set(c.x, y, c.z, "stone_bricks");

  for (let y = c.gy; y < c.T; y++) {
    const L = y - B;
    if (y === c.T - 1 && d >= 1) {
      g.set(c.x, y, c.z, "smooth_stone"); // roof deck
      continue;
    }
    if (d === 0) {
      const [id, props] = facade(c, y);
      if (props) g.set(c.x, y, c.z, id, props);
      else g.set(c.x, y, c.z, id);
    } else if (d === 1) {
      if (y === c.gy || L % 2 === 0) {
        g.set(c.x, y, c.z, "smooth_stone"); // floor slab
      } else if ((c.x * 7 + y * 3) % 11 === 0) {
        g.set(c.x, y, c.z, "glowstone"); // warm light behind glass
      }
    } else {
      g.set(c.x, y, c.z, "stone");
    }
  }

  if (d === 0) {
    g.set(c.x, c.T, c.z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Recessed central entrance: double doors, glazed lintel, canopy on a support slab.
for (const x of doorXs) {
  g.set(x, ge + 1, minZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, ge + 2, minZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}
for (const x of canopyXs) {
  if (!doorXs.includes(x)) g.set(x, ge + 2, minZ, "quartz_block");
  if (cmap.has(key(x, minZ + 1))) {
    g.set(x, ge + 2, minZ + 1, "smooth_stone");
    g.set(x, ge + 3, minZ + 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  g.set(x, ge + 3, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Lanterns under the canopy so the entrance reads at dusk.
for (const x of doorXs) {
  if (cmap.has(key(x, minZ + 1))) {
    g.set(x, ge + 2, minZ + 2, "air");
    g.set(x, ge + 2, minZ + 1, "smooth_stone");
  }
}

// Mechanical penthouse stepping in from the roof edge, on the dominant tier.
for (const c of all) {
  const d = dist.get(key(c.x, c.z));
  if (d < 3) continue;
  for (let y = c.T; y <= c.T + 2; y++) {
    if (d === 3 && y === c.T + 1 && (c.x + c.z) % 2 === 0) {
      g.set(c.x, y, c.z, "iron_bars");
    } else {
      g.set(c.x, y, c.z, "light_gray_concrete");
    }
  }
  g.set(c.x, c.T + 3, c.z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
