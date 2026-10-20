import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw409588085";
const W = 26, H = 47, D = 22;
const ROOF = 35;        // roof height above lowest ground (lidar)
const STOREYS = 7;      // ~5 blocks per storey
const SETBACK_FROM = 5; // storeys 5 and 6 step back from the outer edge

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint -----------------------------------------------------------
const cs = raw.map(([x, z, gr]) => ({ x, z, g: gr }))
  .filter(c => c.x >= 0 && c.x < W && c.z >= 0 && c.z < D);
const gmin = Math.min(...cs.map(c => c.g));
cs.forEach(c => { c.g = Math.min(30, Math.round(c.g - gmin)); });

const key = (x, z) => `${x},${z}`;
const fp = new Map(cs.map(c => [key(c.x, c.z), c]));
const inFp = (x, z) => fp.has(key(x, z));
const gAt = (x, z) => fp.get(key(x, z)).g;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => NB.some(([dx, dz]) => !inFp(x + dx, z + dz));

// distance in cells from the outer edge (outer edge cells = 1)
const dist = new Map();
const queue = [];
for (const c of cs) {
  if (isEdge(c.x, c.z)) { dist.set(key(c.x, c.z), 1); queue.push([c.x, c.z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 99;

// storey footprint: full plan below the setback, inset ring above it
const S = (k, x, z) => inFp(x, z) && (k < SETBACK_FROM || dOf(x, z) >= 3);
const edgeS = (k, x, z) => S(k, x, z) && NB.some(([dx, dz]) => !S(k, x + dx, z + dz));

// storey lines: continuous stacking from each cell's ground up to the roof
const floorY = (k, gr) => gr + Math.round(k * (ROOF - gr) / STOREYS);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// ---- entrance: south-facing (max z) edge cell nearest the middle ---------
const edgeCells = cs.filter(c => isEdge(c.x, c.z));
const maxEdgeZ = Math.max(...edgeCells.map(c => c.z));
const southEdge = edgeCells.filter(c => c.z === maxEdgeZ);
const doorCell = southEdge.reduce((best, c) =>
  (!best || Math.abs(c.x - W / 2) < Math.abs(best.x - W / 2)) ? c : best, null);

// overrides for door, jambs, lintel (keyed "x,y,z")
const overrides = new Map();
if (doorCell) {
  const fy0 = doorCell.g;
  const dz = doorCell.z;
  overrides.set(`${doorCell.x},${fy0 + 1},${dz}`, ["dark_oak_door",
    { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]);
  overrides.set(`${doorCell.x},${fy0 + 2},${dz}`, ["dark_oak_door",
    { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }]);
  for (const dx of [-1, 1]) {
    const x = doorCell.x + dx;
    if (inFp(x, dz) && isEdge(x, dz)) {
      overrides.set(`${x},${fy0 + 1},${dz}`, ["stone_bricks", null]);
      overrides.set(`${x},${fy0 + 2},${dz}`, ["stone_bricks", null]);
    }
  }
  for (let dx = -1; dx <= 1; dx++) {
    const x = doorCell.x + dx;
    if (inFp(x, dz) && isEdge(x, dz)) {
      overrides.set(`${x},${fy0 + 3},${dz}`, ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]);
    }
  }
}

// ---- build -----------------------------------------------------------------
for (const c of cs) {
  // foundation up to ground
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

  // floor slabs: ground slab everywhere; each higher slab only where the storey below exists
  for (let k = 0; k <= STOREYS; k++) {
    if (k === 0 || S(k - 1, c.x, c.z)) {
      put(c.x, floorY(k, c.g), c.z, "light_gray_concrete");
    }
  }

  // facades per storey on the edges of that storey's plan
  for (let k = 0; k < STOREYS; k++) {
    if (!edgeS(k, c.x, c.z)) continue;
    const fy = floorY(k, c.g);
    const top = floorY(k + 1, c.g);
    for (let y = fy + 1; y <= top - 1; y++) {
      const ks = `${c.x},${y},${c.z}`;
      if (overrides.has(ks)) {
        const [b, p] = overrides.get(ks);
        if (p) put(c.x, y, c.z, b, p); else put(c.x, y, c.z, b);
        continue;
      }
      if (y === top - 1) {
        put(c.x, y, c.z, k === 0 ? "smooth_stone" : "light_gray_concrete");
      } else if ((c.x + c.z) % 3 === 0) {
        put(c.x, y, c.z, k === 0 ? "stone_bricks" : "white_concrete");
      } else {
        const lit = y === fy + 2 && ((c.x * 7 + c.z * 3 + k * 5) % 13 === 0);
        put(c.x, y, c.z, lit ? "glowstone" : "light_blue_stained_glass");
      }
    }
  }

  // terrace parapet around the setback ring at the top of storey 4
  if (S(SETBACK_FROM - 1, c.x, c.z) && !S(SETBACK_FROM, c.x, c.z) && dOf(c.x, c.z) === 1) {
    put(c.x, floorY(SETBACK_FROM, c.g) + 1, c.z, "stone_bricks");
  }

  // roof parapet with cornice and cap on the top tier
  if (edgeS(STOREYS - 1, c.x, c.z)) {
    put(c.x, ROOF + 1, c.z, "stone_bricks");
    put(c.x, ROOF + 2, c.z, "white_concrete");
  }
}

// ---- roof plant room in the middle of the top tier -----------------------
const topCells = cs.filter(c => S(STOREYS - 1, c.x, c.z));
const xs = topCells.map(c => c.x), zs = topCells.map(c => c.z);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const bx0 = minX + 2, bx1 = maxX - 2, bz0 = minZ + 2, bz1 = maxZ - 2;
for (let x = bx0; x <= bx1; x++) {
  for (let z = bz0; z <= bz1; z++) {
    if (!S(STOREYS - 1, x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 4, z, "smooth_stone");
  }
}
const cx = Math.round((bx0 + bx1) / 2), cz = Math.round((bz0 + bz1) / 2);
if (S(STOREYS - 1, cx, cz)) {
  put(cx, ROOF + 5, cz, "lightning_rod");
  put(cx, ROOF + 6, cz, "lightning_rod");
}

// warm lanterns on the top-tier parapet corners for dusk reading
for (const c of topCells) {
  const corner = (c.x === minX || c.x === maxX) && (c.z === minZ || c.z === maxZ);
  if (corner && edgeS(STOREYS - 1, c.x, c.z)) {
    put(c.x, ROOF + 3, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
