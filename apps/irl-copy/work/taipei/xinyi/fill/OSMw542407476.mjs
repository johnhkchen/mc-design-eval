import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407476";
const W = 18, D = 23, H = 47;
const ROOF = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of cells) ground.set(`${c[0]},${c[1]}`, Math.max(0, Math.round(c[2] ?? 0)));
const inFP = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Tiers: lower full-footprint podium-tower body, upper setback tower, penthouse on roof
const L = { x0: 0, x1: W - 1, z0: 0, z1: D - 1 };
const U = { x0: 3, x1: W - 4, z0: 3, z1: D - 4 };
const PH = { x0: 6, x1: 11, z0: 6, z1: 16 };

const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const onRing = (r, x, z) => inRect(r, x, z) && (x === r.x0 || x === r.x1 || z === r.z0 || z === r.z1);

const PANE = "light_blue_stained_glass_pane";
const FR = "white_concrete";
const FLOOR = "light_gray_concrete";

function alongOf(r, x, z) {
  const zEdge = z === r.z0 || z === r.z1;
  return { zEdge, along: zEdge ? x - r.x0 : z - r.z0 };
}

// Facade block for a perimeter cell: relative row inside a 5-block storey (0 = slab line, 4 = band)
function facadeAt(r, x, z, rel) {
  const corner = (x === r.x0 || x === r.x1) && (z === r.z0 || z === r.z1);
  if (corner || rel === 0 || rel === 4) return [FR];
  const { zEdge, along } = alongOf(r, x, z);
  if (along % 3 === 0) return [FR];
  const props = zEdge
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return [PANE, props];
}

// Pass A: foundation under every footprint cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  for (let y = 0; y < gAt(x, z); y++) put(x, y, z, "stone_bricks");
}

// Pass B: lower body, y 0..24
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  const gr = gAt(x, z);
  for (let y = gr; y <= 24; y++) {
    if (onRing(L, x, z)) {
      if (y === 0) { put(x, y, z, "polished_granite"); continue; }
      const [b, p] = facadeAt(L, x, z, y % 5);
      put(x, y, z, b, p);
    } else if (y % 5 === 0) {
      put(x, y, z, FLOOR);
    }
  }
}

// Pass C: lower roof terrace at y=25 and railing at y=26 on the outer edge
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  if (gAt(x, z) > 25) continue;
  put(x, 25, z, onRing(L, x, z) ? FR : FLOOR);
  if (onRing(L, x, z)) put(x, 26, z, "iron_bars");
}

// Pass D: upper setback tower, y 25..34
for (let x = U.x0; x <= U.x1; x++) for (let z = U.z0; z <= U.z1; z++) {
  if (!inFP(x, z)) continue;
  for (let y = 25; y <= 34; y++) {
    if (onRing(U, x, z)) {
      const [b, p] = facadeAt(U, x, z, y % 5);
      put(x, y, z, b, p);
    } else if (y === 30) {
      put(x, y, z, FLOOR);
    }
  }
}

// Pass E: upper roof slab at y=35 with cornice, parapet at y=36
for (let x = U.x0; x <= U.x1; x++) for (let z = U.z0; z <= U.z1; z++) {
  if (!inFP(x, z)) continue;
  if (onRing(U, x, z)) {
    put(x, ROOF, z, FR);
    put(x, ROOF + 1, z, FR);
  } else {
    put(x, ROOF, z, FLOOR);
  }
}

// Pass F: mechanical penthouse y 36..39 with panes, roof cap at y=40
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (onRing(PH, x, z)) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      const [b, p] = facadeAt(PH, x, z, y - ROOF);
      put(x, y, z, b, p);
    }
  }
  put(x, ROOF + 6, z, "smooth_stone");
}

// Pass G: antenna
for (let y = ROOF + 6; y <= ROOF + 8; y++) put(8, y, 11, "lightning_rod");

// Pass H: entrance on the z=0 face (canopy, doors, transom)
for (let x = 7; x <= 10; x++) for (let z = 0; z <= 1; z++) put(x, 4, z, "smooth_stone");
for (const x of [8, 9]) {
  const hinge = x === 8 ? "left" : "right";
  const dp = { facing: "south", hinge, open: "false", powered: "false" };
  put(x, 1, 0, "oak_door", { ...dp, half: "lower" });
  put(x, 2, 0, "oak_door", { ...dp, half: "upper" });
  put(x, 3, 0, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
}

// Pass I: warm lights (glowstone) behind some panes, interior side
function glowRing(r, yLo, yHi) {
  for (let x = r.x0; x <= r.x1; x++) for (let z = r.z0; z <= r.z1; z++) {
    if (!onRing(r, x, z) || !inFP(x, z)) continue;
    for (let y = yLo; y <= yHi; y++) {
      if (y % 5 !== 2 || y < gAt(x, z)) continue;
      const [b] = facadeAt(r, x, z, 2);
      if (b !== PANE) continue;
      const s = Math.floor(y / 5);
      const { zEdge, along } = alongOf(r, x, z);
      if ((along + s) % 4 !== 1) continue;
      const dx = x === r.x0 ? 1 : x === r.x1 ? -1 : 0;
      const dz = z === r.z0 ? 1 : z === r.z1 ? -1 : 0;
      if ((dx && dz) || (!dx && !dz)) continue;
      const ix = x + dx, iz = z + dz;
      if (!inRect(r, ix, iz) || onRing(r, ix, iz)) continue;
      put(ix, y, iz, "glowstone");
    }
  }
}
glowRing(L, 0, 24);
glowRing(U, 25, 34);

g.save(`${DIR}/${ID}.nbt`);
