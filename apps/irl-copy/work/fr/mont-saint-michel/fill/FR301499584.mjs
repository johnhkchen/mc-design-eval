import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499584";
const W = 37, H = 26, D = 52;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
const inFp = new Set();
for (const c of cells) {
  const k = key(c[0], c[1]);
  inFp.add(k);
  info.set(k, { G: Math.round(c[2]), R: Math.round(c[3]) });
}
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const isIn = (x, z) => inFp.has(key(x, z));
const missingCount = (x, z) =>
  [!isIn(x + 1, z), !isIn(x - 1, z), !isIn(x, z + 1), !isIn(x, z - 1)].filter(Boolean).length;
const isPerim = (x, z) => missingCount(x, z) > 0;
const isCorner = (x, z) => missingCount(x, z) >= 2;

function set(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Door: centre of the north (minZ) front
const doorX = Math.floor((minX + maxX) / 2);
const doorKey = key(doorX, minZ);

// Pass 1: foundations, walls, floors, roof
const plan = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const { G, R } = info.get(key(x, z));
  let n = Math.max(1, Math.round((R - G) / 5));
  n = Math.min(n, Math.floor((H - 2 - G) / 5));
  n = Math.max(1, n);
  const T = G + 5 * n;
  plan.set(key(x, z), { G, T, n });

  // foundation from y0 up to ground
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  if (perim) {
    for (let y = G; y < T; y++) set(x, y, z, "stone_bricks");
    for (let k = 1; k < n; k++) set(x, G + 5 * k, z, "chiseled_stone_bricks");
  } else {
    for (let k = 0; k < n; k++) set(x, G + 5 * k, z, "stone_bricks");
  }
  // slate roof cap over every cell
  set(x, T - 1, z, "deepslate_tiles");
  // parapet on the perimeter
  if (perim && T < H) {
    set(x, T, z, "stone_brick_wall", {
      up: "true", north: "low", south: "low", east: "low", west: "low", waterlogged: "false",
    });
  }
}

// Pass 2: windows, lanterns, door, chimneys
for (const c of cells) {
  const x = c[0], z = c[1];
  const { G, T, n } = plan.get(key(x, z));
  if (!isPerim(x, z) || isCorner(x, z)) continue;

  const alongZFace = !isIn(x, z - 1) || !isIn(x, z + 1); // face normal along z
  const idx = (z === minZ || z === maxZ) ? x : z;
  const isDoor = key(x, z) === doorKey;

  // inward neighbour for lantern placement
  let inward = null;
  if (isIn(x, z - 1) && !isPerim(x, z - 1)) inward = [x, z - 1];
  else if (isIn(x, z + 1) && !isPerim(x, z + 1)) inward = [x, z + 1];
  else if (isIn(x - 1, z) && !isPerim(x - 1, z)) inward = [x - 1, z];
  else if (isIn(x + 1, z) && !isPerim(x + 1, z)) inward = [x + 1, z];

  for (let k = 0; k < n; k++) {
    const f = G + 5 * k;
    const isGroundFloor = k === 0;
    if (isGroundFloor && isDoor) continue;
    if (idx % 3 !== 1) continue;

    const orient = alongZFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = f + 1; y <= f + 3 && y < T - 1; y++) {
      set(x, y, z, "glass_pane", orient);
    }

    if (inward && (k + idx) % 2 === 0) {
      const [ix, iz] = inward;
      set(ix, f + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // door and canopy on the entrance front
  if (isDoor) {
    set(x, G + 1, z, "air");
    set(x, G + 2, z, "air");
    set(x, G + 1, z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    set(x, G + 2, z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    set(x, G + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Chimney stacks on interior roofs
for (const c of cells) {
  const x = c[0], z = c[1];
  if (isPerim(x, z)) continue;
  const { T } = plan.get(key(x, z));
  if (x % 8 === 4 && z % 10 === 5 && T + 2 < H) {
    for (let y = T; y <= T + 2; y++) set(x, y, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
