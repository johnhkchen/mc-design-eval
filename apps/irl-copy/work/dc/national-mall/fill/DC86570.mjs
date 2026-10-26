import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// United States Chamber of Commerce, 1615 H St NW (DC86570)
// Early-20th-century Neo-Classical office block: limestone-look calcite walls,
// stone-brick base and cornice, bright quartz piers, light-blue glass bays,
// a centred entrance on the north (z = min) face, and a roof deck carrying
// one plant room and a few small rooftop units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86570";
const W = 29, H = 27, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  map.set(key(c[0], c[1]), { x: c[0], z: c[1], g: c[2], r: c[3] });
}
const has = (x, z) => map.has(key(x, z));

// Depth from the outer edge: 1 = facade, 2 = air gap behind glass, 3+ = solid core.
const depth = new Map();
const queue = [];
for (const c of map.values()) {
  const edge = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  if (edge) {
    depth.set(key(c.x, c.z), 1);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz;
    const k = key(nx, nz);
    if (has(nx, nz) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(map.get(k));
    }
  }
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const c of map.values()) {
  minX = Math.min(minX, c.x);
  maxX = Math.max(maxX, c.x);
  minZ = Math.min(minZ, c.z);
  maxZ = Math.max(maxZ, c.z);
}
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Clamped ground and roof per cell.
const dims = new Map();
for (const c of map.values()) {
  const g0 = Math.max(0, Math.min(c.g, H - 6));
  const roof = Math.max(g0 + 4, Math.min(c.r, H - 4));
  dims.set(key(c.x, c.z), { g0, roof, top: roof - 1 });
}

const FOUNDATION = "stone_bricks";
const BASE = "stone_bricks";
const WALL = "calcite";
const PIER = "quartz_block";
const CORNICE = "stone_brick_slab";
const DECK = "smooth_stone";
const FLOOR = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";

for (const c of map.values()) {
  const { x, z } = c;
  const dep = depth.get(key(x, z)) ?? 3;
  const { g0, top } = dims.get(key(x, z));

  for (let y = 0; y < g0; y++) g.set(x, y, z, FOUNDATION);

  const faceZ = !has(x, z - 1) || !has(x, z + 1);
  const faceX = !has(x - 1, z) || !has(x + 1, z);
  const corner = faceZ && faceX;
  const u = faceZ && !faceX ? x : z;
  const isPier = corner || u % 4 === 0;
  const frontFace = !has(x, z - 1) && faceZ;
  const vestibule = dep === 2 && z === minZ + 1 && Math.abs(x - cx) <= 1;

  for (let y = g0; y <= top; y++) {
    const h = y - g0;

    if (dep >= 3) {
      g.set(x, y, z, y === top ? DECK : "smooth_stone");
      continue;
    }

    if (dep === 2) {
      // Air gap behind the glass, with floor slabs at each storey line.
      if (vestibule && h < 2) {
        if (x === cx && h === 1) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        continue;
      }
      if (h < 2) { g.set(x, y, z, BASE); continue; }
      if (y === top) { g.set(x, y, z, DECK); continue; }
      const rel = (h - 2) % 4;
      if (rel === 0) { g.set(x, y, z, FLOOR); continue; }
      if (rel === 1 && (x * 3 + z * 5 + Math.floor(h / 4)) % 7 === 0) {
        g.set(x, y, z, "glowstone");
        continue;
      }
      continue;
    }

    // Facade.
    if (y === top) { g.set(x, y, z, WALL); continue; }
    if (h < 2) {
      if (frontFace && Math.abs(x - cx) <= 1) {
        if (x === cx) {
          const half = h === 0 ? "lower" : "upper";
          g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, PIER, {});
        }
        continue;
      }
      g.set(x, y, z, BASE);
      continue;
    }
    if (y === top - 1) {
      g.set(x, y, z, CORNICE, { type: "top", waterlogged: "false" });
      continue;
    }

    const rel = (h - 2) % 4;
    if (rel === 0 || rel === 3) {
      // Storey line: spandrel, with a sill course at the bottom of each bay.
      g.set(x, y, z, WALL);
    } else if (isPier) {
      g.set(x, y, z, PIER, {});
    } else {
      const props = faceZ && !faceX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, GLASS, props);
    }
  }
}

// Roof plant: one plant room over the central core, two blocks high on the deck,
// plus a few small units on other interior cells. Every unit stands on the deck.
for (const c of map.values()) {
  const dep = depth.get(key(c.x, c.z)) ?? 3;
  if (dep < 3) continue;
  const { top } = dims.get(key(c.x, c.z));
  if (top + 2 >= H) continue;
  const inPlantRoom = Math.abs(c.x - cx) <= 3 && Math.abs(c.z - cz) <= 2;
  const isUnit = !inPlantRoom && c.x % 8 === 4 && c.z % 8 === 4;
  if (inPlantRoom) {
    g.set(c.x, top + 1, c.z, "light_gray_concrete");
    g.set(c.x, top + 2, c.z, "smooth_stone_slab" === "" ? "" : "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else if (isUnit) {
    g.set(c.x, top + 1, c.z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
