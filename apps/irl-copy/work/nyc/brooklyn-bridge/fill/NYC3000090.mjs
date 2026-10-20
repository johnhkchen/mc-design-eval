import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 68 Jay Street, DUMBO, 1914. Brick commercial/office block on a granite base,
// cream terracotta bands, stone cornice, flat roof. Storeys are 4 blocks tall.
// Roof heights are smoothed over a 5x5 window and snapped to storey tiers so the
// massing steps in clean floors instead of stair-like lidar noise.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000090";
const W = 45, H = 40, D = 43;
const STOREY = 4;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const cells = new Map();
for (const c of list) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cells.set(`${x},${z}`, { x, z, g: Math.max(0, Math.round(gr)), r: Math.round(rf) });
}
const has = (x, z) => cells.has(`${x},${z}`);
const at = (x, z) => cells.get(`${x},${z}`);

// Wider smoothing, then snap to storey tiers (multiples of 4) above the cell's ground.
for (const c of cells.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (has(c.x + dx, c.z + dz)) { sum += at(c.x + dx, c.z + dz).r; n++; }
  }
  const avg = sum / n;
  let R = Math.round(avg / STOREY) * STOREY;
  R = Math.max(c.g + 2 * STOREY, Math.min(32, R));
  c.R = R;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Main entrance: north-facing edge cell nearest the footprint's centre line.
let sumX = 0, nC = 0;
for (const c of cells.values()) { sumX += c.x; nC++; }
const cx = sumX / nC;
let doorKey = null, best = Infinity;
for (const c of cells.values()) {
  if (!has(c.x, c.z - 1) && Math.abs(c.x - cx) < best) {
    best = Math.abs(c.x - cx);
    doorKey = `${c.x},${c.z}`;
  }
}
const isNorthEdge = (x, z) => !has(x, z - 1);

for (const c of cells.values()) {
  const { x, z, g: gr, R } = c;

  // Foundation: solid fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push({ facing: "north", u: x });
  if (!has(x, z + 1)) faces.push({ facing: "south", u: x });
  if (!has(x - 1, z)) faces.push({ facing: "west", u: z });
  if (!has(x + 1, z)) faces.push({ facing: "east", u: z });

  if (faces.length === 0) {
    // Interior: floor slabs at storey lines, air between, roof slab on top.
    for (let y = gr; y < R; y++) {
      if ((y - gr) % STOREY === 0) put(x, y, z, "smooth_stone");
    }
    put(x, R - 1, z, "stone");
    continue;
  }

  const u = faces[0].u;
  const isDoor = `${x},${z}` === doorKey;
  // Door surround: the two neighbouring bays on the entrance face frame the door.
  const isDoorFrame = isNorthEdge(x, z) && doorKey !== null &&
    Math.abs(x - Number(doorKey.split(",")[0])) === 1 &&
    z === Number(doorKey.split(",")[1]);

  for (let y = gr; y <= R - 3; y++) {
    const h = y - gr;
    let id;
    let p;
    if (h === 0) {
      id = "polished_granite";
    } else if (h < STOREY) {
      if (h === 3) id = "smooth_stone";
      else if (u % 4 === 0) id = "bricks";
      else id = "glass";
      if (isDoorFrame && h < 3) id = "polished_andesite";
    } else {
      const m = h % STOREY;
      if (u % 4 === 0) id = "bricks";
      else if (m === 0 || m === 3) id = "white_terracotta";
      else {
        id = "glass";
        if (m === 1 && (x * 7 + y * 5 + u * 3) % 9 === 0) id = "glowstone";
      }
    }
    if (isDoor && (h === 1 || h === 2)) {
      id = "dark_oak_door";
      p = { facing: "north", half: h === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    put(x, y, z, id, p);
  }

  // Cornice: terracotta dentil course under a stone cap.
  put(x, R - 2, z, "white_terracotta");
  put(x, R - 1, z, "smooth_stone");

  // Parapet and coping.
  put(x, R, z, "bricks");
  put(x, R + 1, z, "bricks");
  put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a small wood water tower near the roof centre, on interior cells.
const xs = [...cells.values()].map(c => c.x), zs = [...cells.values()].map(c => c.z);
const mx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const mz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
const isInterior = (x, z) => has(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => has(x + a, z + b));
const tankCells = [[mx - 1, mz - 1], [mx, mz - 1], [mx - 1, mz], [mx, mz]];
if (tankCells.every(([x, z]) => isInterior(x, z))) {
  const tankRoof = Math.max(...tankCells.map(([x, z]) => at(x, z).R));
  for (const [x, z] of tankCells) {
    for (let y = tankRoof; y <= tankRoof + 2; y++) put(x, y, z, "oak_planks");
    put(x, tankRoof + 3, z, "oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
