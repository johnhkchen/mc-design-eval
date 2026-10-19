// 400 Park Avenue, 1957 commercial and office building: a 25-storey (75-block, about 83 m) office slab in pale spandrels
// and blue-green glass on a granite base, the International Style of its date. Footprint 25 x 24 (x across, low z = north).
// The Park Avenue frontage is the east face (x = 24): the lobby sits there at ground level, behind a three-bay glass
// front with a door in the middle bay and a granite lintel above. The lidar roof is smoothed (a 3 x 3 median of the real
// returns, zeros are holes) and snapped to clean storey tiers: a 75-block main slab, a 63-block east wing and a stepped
// descent down to 21 blocks in the south-west. A 3-block mechanical bulkhead sits on the north-west of the roof.
// Glass sits in the outer ring of the footprint, one block out from a solid core, with an air gap behind each pane in
// the row inside it (no interiors); a few gaps hold glowstone for the warm lit windows. Mullions run every third block.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035751.cells.json`, "utf8"));
const X = 25, Y = 80, Z = 24;

const raw = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => raw.has(`${x},${z}`);

// Clean roof tiers (block heights above y 0), one per 3-block storey step.
const TIERS = [75, 66, 63, 57, 51, 42, 36, 27, 21];
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const smooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = raw.get(`${x + dx},${z + dz}`);
    if (r > 0) v.push(r);
  }
  return v.length ? median(v) : 0;
};
const snap = (r) => TIERS.reduce((b, t) => (Math.abs(t - r) < Math.abs(b - r) ? t : b));

const top = new Map();
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number);
  const r = smooth(x, z);
  top.set(k, r > 0 ? snap(r) : 0);
}
const T = (x, z) => top.get(`${x},${z}`) ?? 0;          // 0 outside the footprint
const solid = (x, y, z) => y < T(x, z);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (!solid(x + dx, y, z + dz)) return d; }
  return null;
};

const WIN = "light_blue_stained_glass", FRAME = "gray_concrete", SPAND = "white_concrete";
const CORE = "stone", BASE = "polished_granite", CAP = "smooth_stone", ROOF = "gray_concrete";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const panes = [];

// 1. Facade and core, column by column. Outer ring: granite base at y 0, pale storey lines every 3 blocks, glass
// with mullions every third block between them, a cornice on each roof edge. Inside: solid core, roof covering on top.
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number), t = T(x, z);
  for (let y = 0; y < t; y++) {
    const face = faceOf(x, y, z);
    if (!face) { put(x, y, z, y === t - 1 ? ROOF : CORE); continue; }
    const along = face === "N" || face === "S" ? x : z;
    if (y === t - 1) put(x, y, z, CAP);
    else if (y === 0) put(x, y, z, BASE);
    else if (y % 3 === 0) put(x, y, z, SPAND);
    else if (along % 3 === 0) put(x, y, z, FRAME);
    else { put(x, y, z, WIN); panes.push([x, y, z, along, DIRS[face]]); }
  }
}

// 2. Air gap behind each pane (one block in, on the inner side of the glass), with glowstone in some of them.
for (const [x, y, z, along, [dx, dz]] of panes) {
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || y >= T(ix, iz) || faceOf(ix, y, iz)) continue;
  if (lit(along, y, x + z)) put(ix, y, iz, "glowstone");
  else put(ix, y, iz, "air");
}

// 3. Lobby on the Park Avenue (east) face: the middle three bays open at ground level, a door in the middle, and a
// granite lintel over the opening on the storey line above (it stands on the solid wall either side).
for (let y = 1; y <= 2; y++) for (let z = 10; z <= 12; z++) { put(24, y, z, "air"); put(23, y, z, "air"); }
put(24, 1, 11, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(24, 2, 11, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let z = 9; z <= 13; z++) put(24, 3, z, BASE);

// 4. Mechanical bulkhead on the north-west of the 75-block roof: a two-block box with a cap, standing on the roof.
for (let x = 9; x <= 13; x++) for (let z = 3; z <= 6; z++) {
  if (T(x, z) !== 75) continue;
  put(x, 75, z, "light_gray_concrete"); put(x, 76, z, "light_gray_concrete"); put(x, 77, z, CAP);
}

const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of out) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save(`${DIR}/NYC1035751.nbt`);
console.log(JSON.stringify({ footprint: top.size, tiers: [...new Set(top.values())].sort((a, b) => b - a), ...stats }));
