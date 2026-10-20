import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000025";
const W = 29, H = 23, D = 27;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? []);

const key = (x, z) => `${x},${z}`;
const cellsByKey = new Map();
for (const row of rows) {
  const [x, z, gr, ro] = Array.isArray(row) ? row : [row.x, row.z, row.ground, row.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(Math.round(gr), H - 8));
  cellsByKey.set(key(x, z), { x, z, ground, roof: ro });
}

// Outward directions: [dx, dz, facing name]
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Smoothed roof per cell (3x3 mean of lidar roof heights).
const smooth = new Map();
for (const [k, c] of cellsByKey) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cellsByKey.get(key(c.x + dx, c.z + dz));
    if (o) { s += o.roof; n++; }
  }
  smooth.set(k, s / n);
}

// One building-wide roof tier (median), with real setbacks only where the lidar is well above it.
const sv = [...smooth.values()].sort((a, b) => a - b);
const base = sv[Math.floor(sv.length / 2)];
const tops = new Map();
for (const [k, c] of cellsByKey) {
  const a = smooth.get(k);
  const target = a >= base + 3 ? a : base;
  let tc = c.ground + 2 * Math.round((target - c.ground) / 2);
  tc = Math.max(c.ground + 4, tc);
  tc = Math.min(tc, c.ground + 2 * Math.floor((H - 3 - c.ground) / 2));
  tops.set(k, tc);
}

const outOf = (c) => DIRS.filter(([dx, dz]) => !cellsByKey.has(key(c.x + dx, c.z + dz)));
const info = new Map();
for (const [k, c] of cellsByKey) {
  const out = outOf(c);
  info.set(k, { out, edge: out.length > 0, corner: out.length >= 2, tc: tops.get(k), gc: c.ground });
}

// Block map: "x,y,z" -> [name, props]
const B = new Map();
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  B.set(`${x},${y},${z}`, [name, props || {}]);
};

// Pass 1: massing, foundation, base, storey lines, windows, cornice, roof.
for (const [k, c] of cellsByKey) {
  const { x, z } = c;
  const { edge, corner, tc, gc } = info.get(k);
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  const topR = tc - gc - 1;
  const isWin = edge && !corner && (x + z) % 2 === 0;
  for (let y = gc; y < tc; y++) {
    const r = y - gc;
    if (!edge) {
      put(x, y, z, y === tc - 1 ? "smooth_stone" : "bricks");
      continue;
    }
    let name = "bricks", props = null;
    if (r === 0) name = "stone_bricks";                       // base course
    else if (r === topR) name = "stone_bricks";                // cornice
    else if (corner) name = "stone_bricks";                    // quoins
    else if (r === 1) name = "glass";                          // shopfront glass
    else if (r % 2 === 0) { name = "stone_brick_slab"; props = { type: "bottom", waterlogged: "false" }; } // string course
    else if (isWin) name = "glass_pane";                       // upper windows
    else name = "bricks";                                      // piers
    put(x, y, z, name, props);
  }
}

// Pass 2: air niches behind window glass, with warm lights in some.
for (const [k, c] of cellsByKey) {
  const { x, z } = c;
  const { out, edge, corner, gc, tc } = info.get(k);
  if (!edge || corner || out.length !== 1) continue;
  if ((x + z) % 2 !== 0) continue;
  const [dx, dz] = out[0];
  const ix = x - dx, iz = z - dz;
  const inner = cellsByKey.get(key(ix, iz));
  if (!inner) continue;
  const ii = info.get(key(ix, iz));
  for (let y = gc + 1; y < tc - 1; y++) {
    const r = y - gc;
    if (r % 2 === 0 || r < 1 || r >= tc - gc - 1) continue;
    if (y < inner.ground || y >= ii.tc - 1) continue;
    const warm = ((x * 3 + z * 5 + r) % 7 === 0) && r >= 3;
    put(ix, y, iz, warm ? "shroomlight" : "air");
  }
}

// Pass 3: entrance on the north (Plymouth-facing) wall, with a stone surround.
{
  const cands = [];
  for (const [k, c] of cellsByKey) {
    const inf = info.get(k);
    if (!inf.edge || inf.corner) continue;
    const north = inf.out.find(([dx, dz]) => dz === -1);
    if (north) cands.push({ c, out: north, inf });
  }
  let pick = null;
  if (cands.length) {
    const mid = cands.reduce((s, e) => s + e.c.x, 0) / cands.length;
    pick = cands.sort((a, b) => Math.abs(a.c.x - mid) - Math.abs(b.c.x - mid))[0];
  } else {
    const any = [...cellsByKey.values()].filter((c) => info.get(key(c.x, c.z)).edge);
    if (any.length) {
      const c = any[Math.floor(any.length / 2)];
      const inf = info.get(key(c.x, c.z));
      pick = { c, out: inf.out[0], inf };
    }
  }
  if (pick) {
    const { c, out, inf } = pick;
    const facing = out[2];
    const doorProps = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
    // Stone surround: neighbouring wall cells along the same face frame the door.
    const along = out[0] === 0 ? [1, 0] : [0, 1];
    for (const s of [-1, 1]) {
      const nx = c.x + along[0] * s, nz = c.z + along[1] * s;
      if (!cellsByKey.has(key(nx, nz))) continue;
      const ni = info.get(key(nx, nz));
      if (!ni.edge) continue;
      for (let r = 1; r <= 3; r++) {
        if (r >= ni.tc - ni.gc - 1) break;
        put(nx, ni.gc + r, nz, "stone_bricks");
      }
    }
    put(c.x, inf.gc + 1, c.z, "dark_oak_door", doorProps("lower"));
    put(c.x, inf.gc + 2, c.z, "dark_oak_door", doorProps("upper"));
    put(c.x, inf.gc + 3, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: roof-edge lanterns on corners, and a water tower on the roof.
for (const [k, c] of cellsByKey) {
  const inf = info.get(k);
  if (inf.edge && inf.corner) put(c.x, inf.tc, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}
for (const [k, c] of cellsByKey) {
  const inf = info.get(k);
  if (inf.edge || c.x % 9 !== 4 || c.z % 9 !== 4) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => cellsByKey.get(key(c.x + a, c.z + b)));
  if (block.some((o) => !o || info.get(key(o.x, o.z)).edge)) continue;
  if (block.some((o) => info.get(key(o.x, o.z)).tc !== inf.tc)) continue;
  const t = inf.tc;
  for (const o of block) {
    put(o.x, t, o.z, "spruce_planks");
    put(o.x, t + 1, o.z, "spruce_planks");
    if (t + 2 < H) put(o.x, t + 2, o.z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Emit to voxels.
const g = new Voxels([W, H, D]);
for (const [k, [name, props]] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (Object.keys(props).length) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}
g.save(`${DIR}/${ID}.nbt`);
