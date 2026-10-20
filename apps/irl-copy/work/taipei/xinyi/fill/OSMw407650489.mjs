import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise tower, Xinyi office type (c. 1990s-2000s): podium of two storeys,
// a stepped glass-and-spandrel tower with two setbacks, 17 storeys of 5 blocks, roof at +88.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650489";
const W = 36, D = 25, H = 100;
const STOREY = 5;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellList = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cellList) {
  if (x >= 0 && x < W && z >= 0 && z < D) foot.set(key(x, z), Math.round(gr));
}
const cells = [...foot.keys()].map((k) => k.split(",").map(Number));
const minG = Math.min(...foot.values());

// Depth from the outside edge (0 = perimeter cell)
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (DIRS.some(([dx, dz]) => !foot.has(key(x + dx, z + dz)))) {
    depth.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const n = key(x + dx, z + dz);
    if (foot.has(n) && !depth.has(n)) {
      depth.set(n, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

// Storey levels (floor slab level of storey i) and tier caps
const L = (i) => minG + STOREY * i;
const ROOF = L(17);          // roof surface of tower (+85), parapet to +88
const PODIUM_CAP = L(2);     // podium roof
const SETBACK_CAP = L(12);   // mid setback roof

const capFor = (d) => (d <= 1 ? PODIUM_CAP : d <= 3 ? SETBACK_CAP : ROOF);
const capMap = new Map();
for (const [x, z] of cells) capMap.set(key(x, z), capFor(depth.get(key(x, z))));

const baseOf = (gr) => {
  for (let i = 0; i <= 17; i++) if (L(i) >= gr) return L(i);
  return ROOF;
};

// A block at (x,y,z) is on an exposed face if a neighbour is missing or lower than y
const exposed = (x, z, y) =>
  DIRS.some(([dx, dz]) => {
    const n = key(x + dx, z + dz);
    return !capMap.has(n) || capMap.get(n) < y;
  });

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glazing alternates tone by storey so the tower reads as banded, not one flat sheet
function facade(x, z, y, podium, storeyIdx) {
  const outs = DIRS.filter(([dx, dz]) => {
    const n = key(x + dx, z + dz);
    return !capMap.has(n) || capMap.get(n) < y;
  });
  const corner = outs.some(([dx]) => dx !== 0) && outs.some(([, dz]) => dz !== 0);
  const alongX = outs.some(([, dz]) => dz !== 0);
  const idx = alongX ? x : z;
  if (corner || idx % 3 === 0) {
    put(x, y, z, "quartz_pillar", { axis: "y" });
    return;
  }
  const glass = podium
    ? "glass"
    : storeyIdx % 2 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass";
  put(x, y, z, glass);
  // warm light one bay behind the glass, separated from it by an air gap
  if (!podium && (x * 13 + z * 7 + y * 3) % 11 === 0 && outs.length) {
    const [dx, dz] = outs[0];
    const ix = x - 2 * dx, iz = z - 2 * dz;
    const n = key(ix, iz);
    if (capMap.has(n) && capMap.get(n) >= y && !exposed(ix, iz, y)) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// Main massing
for (const [x, z] of cells) {
  const k = key(x, z);
  const gr = foot.get(k);
  const cap = capMap.get(k);
  const base = baseOf(gr);

  // foundation: solid from 0 up to the floor line sitting on this cell's ground
  for (let y = 0; y < base && y < H; y++) put(x, y, z, "stone_bricks");

  if (base > cap) {
    for (let y = base; y <= cap; y++) put(x, y, z, "stone_bricks");
    continue;
  }

  // storeys: slab row, then four rows of glazing
  for (let i = 0; i <= 17; i++) {
    const lk = L(i);
    if (lk < base || lk >= cap) continue;
    const ex = exposed(x, z, lk);
    const podium = lk < PODIUM_CAP;
    if (i === 0 && ex) put(x, lk, z, "polished_andesite");
    else if (ex && !podium && i % 4 === 0) put(x, lk, z, "smooth_quartz"); // belt course
    else if (ex) put(x, lk, z, "white_concrete");
    else put(x, lk, z, "smooth_stone");

    for (let y = lk + 1; y <= lk + 4; y++) {
      if (exposed(x, z, y)) facade(x, z, y, podium, i);
    }
  }

  // roof surface at the cap
  const roofId =
    cap === PODIUM_CAP ? "moss_block" : cap === SETBACK_CAP ? "light_gray_concrete" : "smooth_quartz";
  put(x, cap, z, roofId);

  // parapet on exposed roof edges
  const ph = cap === ROOF ? 3 : 1;
  for (let y = cap + 1; y <= cap + ph; y++) {
    if (exposed(x, z, y)) put(x, y, z, "quartz_block");
  }

  // roof plant boxes on the tower roof
  if (cap === ROOF && x % 7 === 3 && z % 7 === 3) {
    put(x, cap + 1, z, "gray_concrete");
    put(x, cap + 2, z, "gray_concrete");
  }
}

// Spire mast at the centre of the tower roof
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  if (foot.has(key(cx, cz)) && capMap.get(key(cx, cz)) === ROOF) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(cx, y, cz, "quartz_pillar", { axis: "y" });
    put(cx, ROOF + 4, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Entrance lobby on the north face (lowest z), centred in x, on the podium ground floor
{
  const minZ = Math.min(...cells.map(([, z]) => z));
  const xs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
  if (xs.length) {
    const mx = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
    const mk = key(mx, minZ);
    if (foot.has(mk)) {
      const eb = baseOf(foot.get(mk));
      // clear glass lobby across five bays
      for (let dx = -2; dx <= 2; dx++) {
        const n = key(mx + dx, minZ);
        if (!foot.has(n)) continue;
        for (let y = eb + 1; y <= eb + 2; y++) put(mx + dx, y, minZ, "glass");
      }
      // flanking piers
      for (const dx of [-2, 2]) {
        if (foot.has(key(mx + dx, minZ))) {
          put(mx + dx, eb + 1, minZ, "quartz_pillar", { axis: "y" });
          put(mx + dx, eb + 2, minZ, "quartz_pillar", { axis: "y" });
        }
      }
      // door in the centre bay
      const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
      const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
      put(mx, eb + 1, minZ, "dark_oak_door", lower);
      put(mx, eb + 2, minZ, "dark_oak_door", upper);
      // deeper canopy over the lobby, five bays wide
      for (let dx = -2; dx <= 2; dx++) {
        if (foot.has(key(mx + dx, minZ))) {
          put(mx + dx, eb + 3, minZ, "quartz_slab", { type: "bottom", waterlogged: "false" });
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
