import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Kelti Building (克緹國際大樓), 2007. 15 storeys on an 8-block grid (~125 blocks to roof),
// two setbacks at y=88 and y=112, glass-and-white-concrete curtain wall, granite base,
// glowing interiors behind some panes, rooftop plant and mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0115-15F";
const W = 62, H = 137, D = 54;
const ROOF_TOP = 124;
const INTERIOR_ROOF = 120;
const SETBACK1 = 88;
const SETBACK2 = 112;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---------- footprint lookup ----------
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const inFP = (x, z) => G.has(key(x, z));
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// distance from outside the footprint (edge cells = 1)
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inFP(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const D_ = (x, z) => (inFP(x, z) ? (dist.get(key(x, z)) ?? 999) : 0);

const tierMin = (y) => (y < SETBACK1 ? 1 : y < SETBACK2 ? 5 : 10);
const inSet = (x, z, m) => inFP(x, z) && D_(x, z) >= m;
const isEdge = (x, z, m) => inSet(x, z, m) && DIRS.some(([dx, dz]) => !inSet(x + dx, z + dz, m));

// corner: missing outside neighbours in two perpendicular directions
const isCorner = (x, z, m) => {
  const missN = !inSet(x, z - 1, m), missS = !inSet(x, z + 1, m);
  const missE = !inSet(x + 1, z, m), missW = !inSet(x - 1, z, m);
  return (missN || missS) && (missE || missW);
};

// ---------- occupancy bookkeeping ----------
const kind = new Map();
const put = (x, y, z, block, props) => {
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
  kind.set(`${x},${y},${z}`, block);
};
const has = (x, y, z) => kind.has(`${x},${y},${z}`);

const panes = (x, z, m) => ({
  north: String(isEdge(x, z - 1, m)),
  south: String(isEdge(x, z + 1, m)),
  east: String(isEdge(x + 1, z, m)),
  west: String(isEdge(x - 1, z, m)),
  waterlogged: "false",
});

// facade block for a wall cell at height y
function wallBlock(x, z, y, gr, m) {
  if (y >= 121) return ["white_concrete"];                 // parapet
  const k = Math.floor(y / 8);
  const rr = y - gr;
  const r = y % 8;
  const mull = (x + z) % 3 === 0;
  const pier = (x + z) % 6 === 0;                          // heavier quartz mullion every 6th cell
  const corner = isCorner(x, z, m);
  const glass = (x + z + k) % 5 === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";

  if (m === 1 && rr >= 1 && rr < 8) {                      // ground storey: shopfront
    if (corner) return ["polished_andesite"];
    if (rr <= 4) return mull ? ["polished_andesite"] : [glass, panes(x, z, m)];
    if (rr <= 6) return ["light_gray_concrete"];
    return ["smooth_quartz"];
  }
  if (corner) return ["white_concrete"];                   // full-height corner piers
  if (r >= 1 && r <= 5) {
    if (pier) return ["quartz_pillar"];
    return mull ? ["white_concrete"] : [glass, panes(x, z, m)];
  }
  if (r === 6) return ["white_concrete"];
  return ["light_gray_concrete"];                          // spandrel band
}

// ---------- main volume ----------
for (const [x, z, gr] of cells) {
  const d = D_(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_TOP; y++) {
    const m = tierMin(y);
    const mPrev = tierMin(y - 1);

    if (y === gr) {
      put(x, y, z, isEdge(x, z, 1) ? "polished_granite" : "smooth_quartz");
      continue;
    }
    if (y % 8 === 0) {
      if (d >= mPrev) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (!isEdge(x, z, m)) continue;
    const w = wallBlock(x, z, y, gr, m);
    if (w) put(x, y, z, w[0], w[1]);
  }
}

// ---------- ground-floor entrance on the north-facing side ----------
{
  const outerNorth = cells.filter(([x, z]) => isEdge(x, z, 1) && !inFP(x, z - 1));
  const pool = outerNorth.length ? outerNorth : cells.filter(([x, z]) => isEdge(x, z, 1));
  const meanX = pool.reduce((s, c) => s + c[0], 0) / Math.max(1, pool.length);
  pool.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  if (pool.length) {
    const [ex, ez, eg] = pool[0];
    let facing = "north";
    for (const [dx, dz, name] of DIRS) {
      if (!inFP(ex + dx, ez + dz)) { facing = name; break; }
    }
    const hinge = "left";
    // recessed entrance: quartz door surround, doors, lintel
    for (const dx of [-1, 1]) {
      const sx = ex + dx;
      if (isEdge(sx, ez, 1)) {
        put(sx, eg + 1, ez, "smooth_quartz");
        put(sx, eg + 2, ez, "smooth_quartz");
      }
    }
    put(ex, eg + 1, ez, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
    put(ex, eg + 2, ez, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
    // lintel above the door, sitting inside the wall line
    for (const dx of [-1, 0, 1]) {
      const cx = ex + dx;
      if (isEdge(cx, ez, 1)) put(cx, eg + 3, ez, "polished_granite");
    }
    // lanterns on the shopfront either side of the entrance
    for (const dx of [-2, 2]) {
      const lx = ex + dx;
      if (isEdge(lx, ez, 1) && has(lx, eg + 1, ez)) {
        put(lx, eg + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// ---------- warm lights behind some window panes ----------
for (const [x, z] of cells) {
  for (let y = 1; y <= ROOF_TOP; y++) {
    const m = tierMin(y);
    if (!isEdge(x, z, m)) continue;
    const kk = kind.get(`${x},${y},${z}`);
    if (kk !== "light_blue_stained_glass_pane" && kk !== "cyan_stained_glass_pane") continue;
    if ((x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (inSet(nx, nz, m) && !isEdge(nx, nz, m) && !has(nx, y, nz)) {
        const block = (x + y + z) % 3 === 0 ? "shroomlight" : "glowstone";
        put(nx, y, nz, block);
        break;
      }
    }
  }
}

// ---------- rail on the first setback terrace ----------
for (const [x, z] of cells) {
  if (D_(x, z) !== 1) continue;
  const props = {
    north: String(inFP(x, z - 1)),
    south: String(inFP(x, z + 1)),
    east: String(inFP(x + 1, z)),
    west: String(inFP(x - 1, z)),
    waterlogged: "false",
  };
  put(x, SETBACK1 + 1, z, "iron_bars", props);
}

// ---------- roof plant and mast on the top tier ----------
{
  const top = cells.filter(([x, z]) => D_(x, z) >= 11);
  if (top.length) {
    const cx = Math.round(top.reduce((s, c) => s + c[0], 0) / top.length);
    const cz = Math.round(top.reduce((s, c) => s + c[1], 0) / top.length);
    for (const [x, z] of top) {
      if (Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 4 && (x - cx + z - cz) % 2 === 0) {
        for (let y = INTERIOR_ROOF + 1; y <= INTERIOR_ROOF + 3; y++) {
          put(x, y, z, "light_gray_concrete");
        }
      }
    }
    if (D_(cx, cz) >= 11) {
      for (let y = INTERIOR_ROOF + 1; y <= INTERIOR_ROOF + 12; y++) {
        put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
