import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 新光信義傑仕堡 (2002 Xinyi residential-office tower).
// Read as: early-2000s Xinyi glass-and-quartz curtain-wall tower, about 24 storeys of 5 blocks,
// white/light-grey frame with blue-glass window bands, flat roof with parapet,
// central mechanical penthouse, shopfront base with a lobby entrance on the longest north edge.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0114-25F";
const W = 134, H = 133, D = 77;

const BODY_TOP = 120;   // last body block; cornice sits here
const PARAPET = 121;    // parapet and penthouse base
const PENT_TOP = 125;   // penthouse top block
const ROD_Y = 126;      // lightning rod on penthouse

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellsArr = cells.map(([x, z, g]) => ({ x, z, g: Math.floor(g), d: 0 }));

const k = (x, z) => x * 1000 + z;
const G = new Map(cellsArr.map((c) => [k(c.x, c.z), c]));
const has = (x, z) => G.has(k(x, z));

// Facade depth: 0 on the outer ring, increasing inward (BFS from the boundary).
const dep = new Map();
const q = [];
for (const c of cellsArr) {
  const edge = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  if (edge) { dep.set(k(c.x, c.z), 0); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const d = dep.get(k(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz, kk = k(nx, nz);
    if (G.has(kk) && !dep.has(kk)) {
      dep.set(kk, d + 1);
      q.push(G.get(kk));
    }
  }
}
for (const c of cellsArr) c.d = dep.get(k(c.x, c.z)) ?? 0;

const maxD = Math.max(...cellsArr.map((c) => c.d));
const pentThr = Math.ceil(maxD * 0.6);

// Entrance: the longest straight run of north-facing (z-1 missing) facade cells.
const northCells = cellsArr.filter((c) => c.d === 0 && !has(c.x, c.z - 1));
const runs = new Map();
for (const c of northCells) {
  if (!runs.has(c.z)) runs.set(c.z, []);
  runs.get(c.z).push(c.x);
}
let entZ = null, entCx = null, bestLen = -1;
for (const [z, xs] of runs) {
  xs.sort((a, b) => a - b);
  // split into contiguous segments
  let start = xs[0], prev = xs[0];
  const segs = [];
  for (let i = 1; i <= xs.length; i++) {
    if (i === xs.length || xs[i] !== prev + 1) {
      segs.push([start, prev]);
      if (i < xs.length) { start = xs[i]; prev = xs[i]; }
    } else prev = xs[i];
  }
  for (const [a, b] of segs) {
    const len = b - a + 1;
    if (len > bestLen) { bestLen = len; entZ = z; entCx = Math.round((a + b) / 2); }
  }
}
const ENT_HALF = 4;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_ALONG_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_ALONG_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of cellsArr) {
  const { x, z, g: gr, d } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / ground-floor slab.
  put(x, gr, z, "smooth_stone");

  const alongZ = !has(x - 1, z) || !has(x + 1, z); // outward face is east or west
  const pane = alongZ ? PANE_ALONG_Z : PANE_ALONG_X;
  const t = alongZ ? z : x;                          // index along facade for mullions
  const isEntFace = d === 0 && z === entZ && !has(x, z - 1) && entCx !== null;
  const inEntrance = isEntFace && Math.abs(x - entCx) <= ENT_HALF;
  const entFrame = isEntFace && Math.abs(x - entCx) === ENT_HALF + 1;

  for (let y = gr + 1; y <= BODY_TOP; y++) {
    const isFloor = y % 5 === 0;

    if (d === 0) {
      // Outer facade ring.
      if (y === BODY_TOP) { put(x, y, z, "smooth_quartz"); continue; }

      if (inEntrance && y <= gr + 3) {
        // Glazed lobby doorway, dark frame above it.
        if (y === gr + 3) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "glass");
        continue;
      }
      if (entFrame && y <= gr + 4) {
        put(x, y, z, "polished_blackstone");
        continue;
      }

      if (isFloor) { put(x, y, z, "white_concrete"); continue; }   // spandrel / storey line

      if (y < gr + 5) {                                              // shopfront band
        if (t % 3 === 0) put(x, y, z, "polished_andesite");
        else put(x, y, z, "glass");
        continue;
      }

      // Mullions: quartz pillars with a light-grey fin every third bay.
      if (t % 3 === 0) {
        put(x, y, z, t % 6 === 0 ? "quartz_pillar" : "light_gray_concrete",
            t % 6 === 0 ? { axis: "y" } : undefined);
        continue;
      }
      put(x, y, z, "light_blue_stained_glass_pane", pane);           // window glass
    } else {
      // Interior: floor slabs per storey, air gap otherwise.
      if (isFloor) { put(x, y, z, "light_gray_concrete"); continue; }
      if (d === 1 && y % 5 === 2) {
        const h = (x * 31 + z * 17 + y * 7) % 53;
        if (h === 0) put(x, y, z, "shroomlight");
        else if (h === 1) put(x, y, z, "glowstone");
      }
    }
  }

  // Lobby lanterns standing on the floor just inside the doorway.
  if (inEntrance && d === 1 && (Math.abs(x - entCx) === 2)) {
    put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // Parapet ring around the roof.
  if (d === 0) put(x, PARAPET, z, "light_gray_concrete");

  // Central mechanical penthouse.
  if (d >= pentThr) {
    for (let y = PARAPET; y <= PENT_TOP; y++) {
      put(x, y, z, y === PARAPET ? "white_concrete" : "light_gray_concrete");
    }
    // Louvred plant screen on the penthouse edge.
    if (d === pentThr) {
      for (let y = PARAPET + 1; y <= PENT_TOP - 1; y += 2) {
        put(x, y, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      }
    }
  }
}

// Roof-top mast on the deepest core cell.
const core = cellsArr.find((c) => c.d === maxD) ?? cellsArr[0];
put(core.x, ROD_Y, core.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
