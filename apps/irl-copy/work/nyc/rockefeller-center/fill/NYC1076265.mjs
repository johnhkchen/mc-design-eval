// 25 West 52nd Street, Museum of Television & Radio (1989): a postmodern office tower on a granite base.
// Massing follows the lidar roof per cell (smoothed into storey tiers); facade = granite pilasters, pale spandrels,
// blue glass with bronze mullions; a 1-block air gap behind the glass with glowstone in some windows; solid core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1076265.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1076265.nbt";

const W = 16, D = 28, H = 3;              // footprint x 0..15, z 0..27; storeys are 3 blocks
const TOWER = 21;                         // the lidar's 62-66 core is 21 storeys (63 blocks), penthouse above
const LIMIT = 78;                         // the render box height
const GRANITE = "polished_granite", SPANDREL = "smooth_quartz", GLASS = "light_blue_stained_glass";
const BRONZE = "waxed_weathered_copper", CORE = "stone", MEMBRANE = "light_gray_concrete";
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const cellList = cells.map(([x, z]) => [x, z]);
const roofH = new Map(), groundH = new Map();
for (const [x, z, gr, r] of cells) { roofH.set(`${x},${z}`, r); groundH.set(`${x},${z}`, gr); }
const minGround = Math.min(...cells.map((c) => c[2]));

// Storeys per cell: lidar roof / 3, a 3x3 median to take out lidar noise, the tower core snapped to its tier.
const rawS = (x, z) => { const r = roofH.get(`${x},${z}`) ?? 0; return r >= 55 ? TOWER : Math.max(2, Math.round(r / H)); };
const S = new Map();
for (const [x, z] of cellList) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (roofH.has(`${x + dx},${z + dz}`)) vals.push(rawS(x + dx, z + dz));
  }
  // A tall cell needs 5+ tall cells around it and, on a footprint edge, a tall cell directly inward: else it is a lidar
  // strip (the 66-block row on the north edge, one cell deep) and takes the low tier around it.
  const tall = vals.filter((v) => v >= 15);
  const inward = [x === 0 ? [1, z] : null, x === W - 1 ? [W - 2, z] : null, z === 0 ? [x, 1] : null, z === D - 1 ? [x, D - 2] : null];
  const edgeOk = inward.every((c) => !c || rawS(...c) >= 15);
  const low = vals.filter((v) => v < 15).sort((a, b) => a - b);
  const pick = (a) => a[a.length >> 1];
  S.set(`${x},${z}`, tall.length >= 5 && edgeOk ? TOWER : pick(low.length ? low : vals.sort((a, b) => a - b)));
}
const sOf = (x, z) => S.get(`${x},${z}`) ?? 0;
const present = (x, z, s) => x >= 0 && z >= 0 && x < W && z < D && s < sOf(x, z);
const exposed = (x, z, s) => Object.keys(DIRS).filter((d) => !present(x + DIRS[d][0], z + DIRS[d][1], s));
const ringGap = (x, z) => Math.min(x, W - 1 - x, z, D - 1 - z) === 1;   // one cell in from the facade: the air gap
const edge = (x, z) => x === 0 || z === 0 || x === W - 1 || z === D - 1;
const key = (x, y, z) => `${x},${y},${z}`;

// Warm windows: a few glass panes per storey get glowstone in the air gap behind them.
const glow = new Set();
for (const [x, z] of cellList) {
  for (let s = 1; s < sOf(x, z) - 1; s++) {
    const ex = exposed(x, z, s);
    if (ex.length !== 1) continue;
    const [dx, dz] = DIRS[ex[0]];
    const p = dz !== 0 ? x : z;
    if (p % 2 === 1) continue;                                     // mullion, not glass
    if ((s * 5 + p) % 9 === 0) glow.add(key(x - dx, s * H + 1, z - dz));
  }
}
glow.add(key(7, 1, 26)); glow.add(key(8, 1, 26));                  // lobby behind the entrance

const g = new Voxels([W, LIMIT, D]);
const put = (x, y, z, b, st) => { if (y >= 0 && y < LIMIT) g.set(x, y, z, b, st); };

for (const [x, z, gr] of cells) {                                  // foundation under the lowest ground
  for (let y = 0; y < gr - minGround; y++) put(x, y, z, CORE);
}

for (const [x, z] of cellList) {
  const top = sOf(x, z);
  for (let s = 0; s < top; s++) {
    const y = s * H;
    const ex = exposed(x, z, s);
    if (ex.length === 0) {                                         // inside: solid floors, the air gap at ring 1
      put(x, y, z, CORE); put(x, y + 2, z, CORE);
      if (glow.has(key(x, y + 1, z))) put(x, y + 1, z, "glowstone");
      else if (!ringGap(x, z)) put(x, y + 1, z, CORE);
      continue;
    }
    if (ex.length >= 2) { for (let r = 0; r < H; r++) put(x, y + r, z, GRANITE); continue; }   // corner pilaster
    const [dx, dz] = DIRS[ex[0]];
    const p = dz !== 0 ? x : z;                                    // position along the face
    put(x, y, z, s === 0 || s % 7 === 0 ? GRANITE : SPANDREL);      // base course, belt courses, spandrels
    put(x, y + 1, z, p % 2 === 1 ? BRONZE : GLASS);                 // glass panes, bronze mullions
    put(x, y + 2, z, s === 0 || s === top - 1 ? GRANITE : SPANDREL);  // storey line, cornice
  }
  put(x, top * H, z, edge(x, z) ? GRANITE : MEMBRANE);             // parapet at the edge, roof membrane inside
}

// Penthouse on the tower roof (lidar max 66).
for (let x = 5; x <= 10; x++) for (let z = 10; z <= 17; z++) {
  const ring = x === 5 || x === 10 || z === 10 || z === 17;
  const p = x === 5 || x === 10 ? z : x;
  put(x, 63, z, GRANITE);
  put(x, 64, z, ring ? (p % 2 === 1 ? BRONZE : GLASS) : CORE);
  put(x, 65, z, GRANITE);
}

// Plant on the podium roof: two condenser boxes.
for (const x0 of [3, 12]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  put(x0 + dx, 24, 24 + dz, "iron_block"); put(x0 + dx, 25, 24 + dz, "iron_block");
}

// Entrance on the street face (z 27): double doors, glass lobby, a dark canopy band over them.
for (const x of [7, 8]) {
  const hinge = x === 7 ? "left" : "right";
  put(x, 1, 27, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, 27, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
for (let x = 5; x <= 10; x++) put(x, 3, 27, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

const stats = g.save(OUT);
console.log(JSON.stringify({ ...stats, storeysMax: Math.max(...S.values()), glow: glow.size }));
