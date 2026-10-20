import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義雅致, built 2006. Twelve-storey Xinyi residential/office block, white quartz
// facade with light-blue glass bands and white mullions. Stepped back by 3 cells
// at y=40 (terrace on the lower tier), roof slab at y=59, penthouse with a mast.
// Windows are recessed one cell behind the wall line; lit windows glow in the recess.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0029-12F";
const W = 25, H = 71, D = 32;

const TERRACE_Y = 40;   // setback terrace slab
const ROOF_Y = 59;      // main roof slab
const PH_BASE = 60;     // penthouse / parapet start
const PH_ROOF = 63;     // penthouse roof slab
const MAST_TOP = 66;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const ground = new Map();
const fp = new Set();
for (const [x, z, g] of cells) {
  ground.set(key(x, z), Math.round(g));
  fp.add(key(x, z));
}

// Distance (4-neighbour) from the footprint edge, for setbacks and parapets.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !fp.has(key(x + dx, z + dz)))) {
    dist.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d0 = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const k = key(x + dx, z + dz);
    if (fp.has(k) && !dist.has(k)) {
      dist.set(k, d0 + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;

// Tier sets: full footprint, setback tier (inset 3), penthouse core (inset 6).
const B = new Set();
const P = new Set();
for (const [x, z] of cells) {
  if (dOf(x, z) >= 3) B.add(key(x, z));
  if (dOf(x, z) >= 6) P.add(key(x, z));
}

// First missing 4-neighbour direction relative to set S (null if fully enclosed).
const outward = (S, x, z) => {
  for (const [dx, dz] of NB) if (!S.has(key(x + dx, z + dz))) return [dx, dz];
  return null;
};
const missingCount = (S, x, z) => NB.filter(([dx, dz]) => !S.has(key(x + dx, z + dz))).length;

// Door: on the south face, near the middle of the footprint.
const southFace = cells.filter(([x, z]) => !fp.has(key(x, z + 1)));
const xsSorted = southFace.map(([x]) => x).sort((a, b) => a - b);
const doorX = xsSorted.length ? xsSorted[Math.floor(xsSorted.length / 2)] : Math.floor(W / 2);
const doorZ = Math.max(...southFace.filter(([x]) => x === doorX).map(([, z]) => z));

const first = (gr) => Math.ceil(gr / 5) * 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassCandidates = [];

// A window can be recessed if the cell one step inward is a fully enclosed,
// already-built interior cell at this height.
function recessOK(x, y, z, o, S) {
  const ix = x - o[0], iz = z - o[1];
  const k = key(ix, iz);
  if (!fp.has(k) || !S.has(k)) return false;
  if (!NB.every(([dx, dz]) => S.has(key(ix + dx, iz + dz)))) return false;
  const gi = ground.get(k);
  return y >= first(gi);
}

function facade(x, y, z, S, tierB) {
  const o = outward(S, x, z);
  if (!o) return; // interior: air gap
  const k = Math.floor(y / 5);
  const r = y - k * 5; // 1..4 within storey
  const onXFace = o[0] !== 0;
  const idx = onXFace ? z : x;
  const last = onXFace ? D - 1 : W - 1;
  const corner = missingCount(S, x, z) >= 2;
  const mullion = corner || idx % 3 === 0 || idx === 0 || idx === last;
  const isDoor = k === 0 && x === doorX && z === doorZ && o[1] === 1;
  const isJamb = k === 0 && Math.abs(x - doorX) === 1 && z === doorZ && o[1] === 1;
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

  const glassOrMullion = () => {
    if (mullion) {
      put(x, y, z, "white_concrete");
      return;
    }
    const windowRow = r === 2 || r === 3;
    if (windowRow && recessOK(x, y, z, o, S)) {
      // Leave the wall-line cell open; glass sits one block inside.
      glassCandidates.push({ x, y, z, o, tierB, recess: true });
      return;
    }
    put(x, y, z, "light_blue_stained_glass");
  };

  if (k === 0) {
    if (isDoor) {
      if (r === 1) put(x, y, z, "dark_oak_door", doorProps("lower"));
      else if (r === 2) put(x, y, z, "dark_oak_door", doorProps("upper"));
      else put(x, y, z, "quartz_block");
      return;
    }
    if (isJamb) {
      put(x, y, z, "quartz_block"); // entrance jambs
      return;
    }
    if (r === 1) put(x, y, z, "polished_granite");
    else if (r === 2 || r === 3) glassOrMullion();
    else put(x, y, z, "quartz_block");
  } else {
    if (r === 1 || r === 4) put(x, y, z, "quartz_block");
    else glassOrMullion();
  }
}

// Pass 1: foundation, podium, floors, walls, setbacks, roof.
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const dd = dOf(x, z);
  const inB = dd >= 3;
  const inP = dd >= 6;

  // Foundation to the cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Podium up to the first storey line above ground.
  const fl = first(gr);
  for (let y = gr; y < fl; y++) put(x, y, z, "polished_granite");

  for (let y = fl; y <= PH_ROOF; y++) {
    if (y <= ROOF_Y) {
      if (y % 5 === 0) {
        // Floor slabs: full footprint to the terrace, then setback tier only.
        if (y <= TERRACE_Y || inB) put(x, y, z, "light_gray_concrete");
      } else if (y < TERRACE_Y) {
        facade(x, y, z, fp, false);
      } else if (y === TERRACE_Y + 1 && dd === 0) {
        put(x, y, z, "iron_bars");        // terrace railing on the outer edge
      } else if (y < ROOF_Y && inB) {
        facade(x, y, z, B, true);
      }
    } else if (y <= PH_BASE + 2) {
      // Parapet on the setback tier's outer edge.
      if ((y === PH_BASE || y === PH_BASE + 1) && inB && dd === 3 && outward(B, x, z)) {
        put(x, y, z, "quartz_block");
      }
      // Penthouse walls on the core cells.
      if (inP && outward(P, x, z)) {
        if (y === PH_BASE + 1) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "quartz_block");
      }
    } else if (y === PH_ROOF && inP) {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// Mast on the penthouse, nearest to the core centroid.
if (P.size) {
  let mx = 0, mz = 0;
  for (const k of P) { const [a, b] = k.split(",").map(Number); mx += a; mz += b; }
  mx /= P.size; mz /= P.size;
  let best = null, bestD = Infinity;
  for (const k of P) {
    const [a, b] = k.split(",").map(Number);
    const dd2 = (a - mx) ** 2 + (b - mz) ** 2;
    if (dd2 < bestD) { bestD = dd2; best = [a, b]; }
  }
  for (let y = PH_ROOF + 1; y <= MAST_TOP; y++) {
    put(best[0], y, best[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Pass 2: recessed glass behind the open wall-line cells; some lit as glowstone.
for (const c of glassCandidates) {
  if (!c.recess) continue;
  const ix = c.x - c.o[0];
  const iz = c.z - c.o[1];
  const lit = ((c.x * 7 + c.y * 3 + c.z * 5) % 11) === 0;
  put(ix, c.y, iz, lit ? "glowstone" : "light_blue_stained_glass");
}

g.save(`${DIR}/${ID}.nbt`);
