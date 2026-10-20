import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei 101-era Xinyi office tower, built 2005. Roof about 83 blocks (about 16 storeys).
// Podium of three storeys with shopfronts and a lobby door, then three setback tiers of
// cyan glass curtain wall with quartz mullions, a mechanical penthouse and a lightning-rod mast.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0295-2F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0295-2F.nbt";
const W = 27, H = 95, D = 35;
const ROOF = 83;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// distance (in cells) from the nearest non-footprint cell, for setbacks and facade detection
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = DIRS.some(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
  if (edge) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (ground.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const maxG = Math.max(...cells.map(c => c[2]));
const P = maxG + 15; // top of the three-storey podium, common to every cell

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");
}

// 2. Generic tier: shell with facade on the edge cells (dist === d), slabs and air inside,
//    cornice on the top edge, roof on the top interior, warm lights just behind some windows.
function tier({ d, base, top, opts = {} }) {
  for (const [x, z] of cells) {
    const dd = dist.get(key(x, z));
    if (dd < d) continue;
    const b = base(x, z);
    const t = top(x, z);
    if (t <= b) continue;
    const edge = dd === d;
    for (let y = b; y <= t; y++) {
      const rel = y - b;
      if (y === t) {
        put(x, y, z, edge ? (opts.cap ?? "smooth_stone") : (opts.roof ?? "gray_concrete"));
        continue;
      }
      if (edge) {
        if (rel === 0) put(x, y, z, opts.base ?? "light_gray_concrete");
        else if (opts.solid) put(x, y, z, opts.wall ?? "light_gray_concrete");
        else if (rel % 5 === 0) put(x, y, z, opts.spandrel ?? "light_gray_concrete");
        else if ((x + z) % 3 === 0) put(x, y, z, opts.mullion ?? "quartz_pillar");
        else if (rel < 5 && opts.glassLow) put(x, y, z, opts.glassLow);
        else put(x, y, z, opts.glass ?? "cyan_stained_glass");
      } else {
        if (rel === 0 || rel % 5 === 0) {
          put(x, y, z, "smooth_quartz");
        } else if (dd === d + 1 && rel % 5 === 2 && !opts.solid && ((x * 5 + z * 3) % 4 === 0)) {
          put(x, y, z, "glowstone");
        }
      }
    }
  }
}

// 3. Podium: three storeys, base course, shopfront glass on the ground storey
tier({
  d: 0,
  base: (x, z) => ground.get(key(x, z)),
  top: () => P,
  opts: {
    base: "polished_granite",
    glassLow: "light_blue_stained_glass",
    glass: "cyan_stained_glass",
    cap: "smooth_stone",
    roof: "gray_concrete",
  },
});

// 4. Setback tower tiers, all absolute levels above the podium
tier({ d: 3, base: () => P, top: () => 50, opts: { glass: "cyan_stained_glass", cap: "smooth_stone", roof: "gray_concrete" } });
tier({ d: 6, base: () => 50, top: () => 66, opts: { glass: "cyan_stained_glass", cap: "smooth_stone", roof: "gray_concrete" } });
tier({ d: 9, base: () => 66, top: () => ROOF, opts: { glass: "light_blue_stained_glass", cap: "smooth_stone", roof: "gray_concrete" } });

// 5. Mechanical penthouse: solid screen walls on the roof
tier({ d: 11, base: () => ROOF, top: () => ROOF + 5, opts: { solid: true, wall: "light_gray_concrete", cap: "smooth_stone", roof: "gray_concrete" } });

// 6. Lobby entrance on the podium's front (north / min-z) edge
{
  const front = [];
  for (const [x, z] of cells) {
    if (dist.get(key(x, z)) !== 0) continue;
    const out = DIRS.find(([dx, dz]) => !ground.has(key(x + dx, z + dz)));
    if (out) front.push({ x, z, out });
  }
  const northFront = front.filter(f => f.out[2] === "north");
  const pool = northFront.length ? northFront : front;
  if (pool.length) {
    pool.sort((a, b) => a.z - b.z || a.x - b.x);
    const minZ = pool[0].z;
    const row = pool.filter(f => f.z === minZ);
    const e = row[Math.floor(row.length / 2)];
    const gy = ground.get(key(e.x, e.z));
    const facing = e.out[2];
    // door two blocks tall on the podium's ground storey, lintel above
    put(e.x, gy + 1, e.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(e.x, gy + 2, e.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(e.x, gy + 3, e.z, "polished_granite");
    put(e.x, gy + 4, e.z, "light_gray_concrete");
  }
}

// 7. Lightning-rod mast on the penthouse, at the deepest interior cell
{
  let best = null;
  for (const [x, z] of cells) {
    const dd = dist.get(key(x, z));
    if (dd === undefined) continue;
    if (!best || dd > best.dd) best = { x, z, dd };
  }
  if (best && best.dd >= 11) {
    for (let y = ROOF + 6; y <= ROOF + 10 && y < H; y++) put(best.x, y, best.z, "lightning_rod");
  }
}

g.save(OUT);
