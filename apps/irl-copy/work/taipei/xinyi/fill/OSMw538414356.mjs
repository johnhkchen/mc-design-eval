import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414356";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 43;
const g = new Voxels([W, H, D]);

// Design: a two-storey Taipei commercial block (1970s-80s), tiled quartz facade,
// stone plinth, ground-floor shopfront with red signboard band, upper storey
// window bays on pilasters, cornice and parapet. Roof slab at y=10, parapet to y=11.
const ROOF = 10;   // roof slab / parapet row
const CORN = 9;    // cornice row (top of second storey)

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

const perim = new Set();
for (const [x, z] of cells) if (outward(x, z).length > 0) perim.add(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: on the face with the most single-face perimeter cells, mid-bay, not a pillar.
const faceCount = {};
const singleFace = [];
for (const [x, z] of cells) {
  const out = outward(x, z);
  if (out.length === 1) {
    const [dx, dz, name] = out[0];
    faceCount[name] = (faceCount[name] || 0) + 1;
    singleFace.push({ x, z, dx, dz, name, t: dx !== 0 ? z : x });
  }
}
let entFace = null, best = -1;
for (const [n, c] of Object.entries(faceCount)) if (c > best) { best = c; entFace = n; }
const cand = singleFace.filter((c) => c.name === entFace).sort((a, b) => a.t - b.t);
let entKey = null;
if (cand.length) {
  const mid = Math.floor(cand.length / 2);
  const order = [mid, mid + 1, mid - 1, mid + 2, mid - 2];
  for (const i of order) {
    if (i >= 0 && i < cand.length && cand[i].t % 3 !== 0) { entKey = key(cand[i].x, cand[i].z); break; }
  }
  if (!entKey) entKey = key(cand[mid].x, cand[mid].z);
}

// Pass 1: foundations, structure, interior, roof slab.
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (out.length === 0) {
    for (let y = gr; y <= ROOF; y++) put(x, y, z, "light_gray_concrete");
  } else {
    for (let y = gr; y <= CORN; y++) put(x, y, z, "quartz_block");
  }
}

// Pass 2: air gaps behind glazing, lobby air behind the door, a few warm lights.
for (const c of singleFace) {
  const { x, z, dx, dz, t } = c;
  const gr = ground.get(key(x, z));
  const qx = x - dx, qz = z - dz;
  if (!has(qx, qz) || perim.has(key(qx, qz))) continue;
  const qgr = ground.get(key(qx, qz));
  const isDoor = key(x, z) === entKey;
  const isPillar = t % 3 === 0 && !isDoor;
  if (isPillar) continue;

  if (isDoor) {
    for (let y = Math.max(gr, qgr); y <= 3; y++) put(qx, y, qz, "air");
  } else {
    for (let y = Math.max(gr + 1, qgr); y <= 3; y++) put(qx, y, qz, "air");
    if (t % 6 === 2 && gr + 2 <= 3) put(qx, gr + 2, qz, "glowstone");
  }
  for (let y = 6; y <= 9; y++) put(qx, y, qz, "air");
  if (t % 6 === 1) put(qx, 7, qz, "glowstone");
}

// Pass 3: facade on perimeter cells.
for (const [x, z, gr] of cells) {
  const k = key(x, z);
  if (!perim.has(k)) continue;
  const out = outward(x, z);

  if (out.length >= 2) {
    // Corner: quartz pilaster column the full height.
    for (let y = gr; y <= CORN; y++) {
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === 4) put(x, y, z, "red_terracotta");
      else if (y === 5) put(x, y, z, "smooth_stone");
      else put(x, y, z, "quartz_pillar", { axis: "y" });
    }
    put(x, ROOF, z, "stone_brick_wall", { up: "true" });
    continue;
  }

  const [dx, dz, name] = out[0];
  const t = dx !== 0 ? z : x;
  const isDoor = k === entKey;
  const isPillar = t % 3 === 0 && !isDoor;
  const pane = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "stone_brick_wall", { up: "true" });
    } else if (y === gr) {
      if (isDoor) put(x, y, z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "stone_bricks");
    } else if (y <= 3) {
      if (isDoor && y === gr + 1) put(x, y, z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (isPillar) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "glass_pane", pane);
    } else if (y === 4) {
      put(x, y, z, "red_terracotta");
    } else if (y === 5) {
      put(x, y, z, "smooth_stone");
    } else if (y === 6) {
      if (isPillar) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "smooth_quartz");
    } else if (y === 7 || y === 8) {
      if (isPillar) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "glass_pane", pane);
    } else if (y === CORN) {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// Pass 4: rooftop plant boxes on interior roof cells (supported by roof slab).
for (const [x, z, gr] of cells) {
  if (perim.has(key(x, z))) continue;
  if (x % 6 !== 3 || z % 9 !== 4) continue;
  put(x, ROOF + 1, z, "iron_block");
  put(x, ROOF + 2, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
