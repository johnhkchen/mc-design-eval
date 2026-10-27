// Way 347103400: a 1970s brick-and-concrete mid-rise commercial block. Massing from the lidar roof, mode-filtered into
// storey tiers (3 / 4 / 5 storeys on the 4-block grid, a 23-block crown). Walls are solid concrete with a one-block
// cavity behind each window, so the glass sits in a recess; storey lines on the 4-block grid, aluminium mullions every
// 3 blocks, a stone base course and coping, a glazed shopfront ground floor, one entrance with a dark canopy, lit bays,
// and rooftop plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_347103400.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_347103400.nbt";
const [W, H, D] = [57, 35, 107];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map(), raw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); raw.set(key(x, z), r); }

// lidar roof -> storey tiers; a 3x3 mode filter (two passes, ties to the taller) makes the tier edges clean
const tierOf = (r) => (r <= 13 ? 12 : r <= 18 ? 16 : r <= 21 ? 20 : 23);
let tier = new Map([...raw].map(([k, r]) => [k, tierOf(r)]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const k of tier.keys()) {
    const [x, z] = k.split(",").map(Number), n = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const t = tier.get(key(x + dx, z + dz)); if (t !== undefined) n.set(t, (n.get(t) || 0) + 1);
    }
    let best = 0, bc = -1;
    for (const [t, c] of n) if (c > bc || (c === bc && t > best)) { best = t; bc = c; }
    next.set(k, best);
  }
  tier = next;
}

const top = (x, z) => tier.get(key(x, z));                       // undefined outside the footprint
const solid = (x, y, z) => { const t = top(x, z); return t !== undefined && y >= 0 && y < t; };
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
// a cell whose four neighbours are solid at this height: a cavity there is enclosed by structure
const deep = (x, y, z) => solid(x, y, z) && DIRS.every(([dx, dz]) => solid(x + dx, y, z + dz));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const idx = (x, y, z) => (z * H + y) * W + x;

const base = new Array(W * H * D).fill(null);                    // { b, st } or null for air
const ov = new Map();                                            // overrides applied after the base pass
const put = (x, y, z, b, st) => { base[idx(x, y, z)] = { b, st }; };
const cavity = (x, y, z, light) => ov.set(idx(x, y, z), light ? { b: light } : null);

// entrance: the longest run of single-face boundary cells whose inward cavity is enclosed at storey 0
const okDoor = (x, z, [dx, dz]) => {
  const f = exposed(x, 1, z);
  return f.length === 1 && f[0][0] === dx && f[0][1] === dz && deep(x - dx, 1, z - dz) && deep(x - dx, 2, z - dz);
};
let door = null;
for (const d of DIRS) {
  const su = d[0] !== 0 ? [0, 1] : [1, 0];
  for (const k of tier.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!okDoor(x, z, d) || okDoor(x - su[0], z - su[1], d)) continue;   // start of a run
    let n = 0; while (okDoor(x + n * su[0], z + n * su[1], d)) n++;
    if (!door || n > door.n) door = { n, x, z, d, su };
  }
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const t = top(x, z); if (t === undefined) continue;
  const g = ground.get(key(x, z));
  for (let y = 0; y < t; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) { put(x, y, z, y === t - 1 ? "gray_concrete" : "white_concrete"); continue; }   // structure / roof deck
    if (y === t - 1) { put(x, y, z, "stone_bricks"); continue; }      // parapet coping
    if (y < g || y === 0) { put(x, y, z, "stone_bricks"); continue; } // foundation and base course
    if (y % 4 === 0 || y % 4 === 3) { put(x, y, z, "light_gray_concrete"); continue; }  // storey lines
    // on the diagonal's stepped edge most cells expose two faces; the first one takes the bay pattern
    const [dx, dz] = faces[0], u = dx !== 0 ? z : x;
    if (u % 3 === 0) { put(x, y, z, "iron_block"); continue; }        // aluminium mullion
    const ix = x - dx, iz = z - dz;
    if (!deep(ix, y, iz)) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, y < 4 ? "glass" : "light_blue_stained_glass");
    const h = hash(x, y, z);
    const light = y < 4 ? (h % 6 === 0 ? "glowstone" : null) : h % 9 === 0 ? "glowstone" : h % 31 === 0 ? "shroomlight" : null;
    cavity(ix, y, iz, light);                                        // the recess behind the glass: air, or a lamp
  }
}

if (door) {
  const { n, x, z, d, su } = door, mid = Math.floor((n - 1) / 2);
  const cx = x + mid * su[0], cz = z + mid * su[1], facing = d[2];
  ov.set(idx(cx, 1, cz), { b: "iron_door", st: { facing, half: "lower", hinge: "left", open: "false", powered: "false" } });
  ov.set(idx(cx, 2, cz), { b: "iron_door", st: { facing, half: "upper", hinge: "left", open: "false", powered: "false" } });
  cavity(cx - d[0], 1, cz - d[1], null); cavity(cx - d[0], 2, cz - d[1], null);
  for (let m = Math.max(0, mid - 2); m <= Math.min(n - 1, mid + 2); m++) {
    ov.set(idx(x + m * su[0], 3, z + m * su[1]), { b: "black_concrete" });    // canopy over the door run
  }
}

// rooftop plant: 2x2 units standing on a flat roof tier, clear of the edges
for (const [k, t] of tier) {
  const [x, z] = k.split(",").map(Number);
  if (x % 10 !== 5 || z % 10 !== 5) continue;
  let clear = true;
  for (let dx = -2; dx <= 3; dx++) for (let dz = -2; dz <= 3; dz++) if (tier.get(key(x + dx, z + dz)) !== t) clear = false;
  if (!clear) continue;
  for (let ux = 0; ux < 2; ux++) for (let uz = 0; uz < 2; uz++) {
    ov.set(idx(x + ux, t, z + uz), { b: "iron_block" });
    ov.set(idx(x + ux, t + 1, z + uz), { b: "iron_block" });
  }
}

for (const [i, v] of ov) base[i] = v;
const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const v = base[idx(x, y, z)];
  if (v) g.set(x, y, z, v.b, v.st);
}
const { blocks, palette } = g.save(OUT);
console.log(`way_347103400: ${blocks} blocks, ${palette} palette entries, entrance run ${door?.n ?? 0}`);
