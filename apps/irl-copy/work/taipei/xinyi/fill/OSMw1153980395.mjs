import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980395";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 23, D = 16;
const ROOF = 10;          // roof deck / cornice course (absolute y)
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const KEY = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(KEY(x, z), Math.round(gr));
const has = (x, z) => G.has(KEY(x, z));
const grd = (x, z) => G.get(KEY(x, z));
const exp = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const isRing = (x, z) => { const e = exp(x, z); return e.n || e.s || e.w || e.e; };

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// ---- front door position: middle of the street-facing (north, z-min) edge ----
const frontXs = cells
  .filter(([x, z]) => exp(x, z).n)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

// ---- 1. foundations: solid from y 0 up to each cell's ground -----------------
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  for (let y = 0; y < gg && y < H; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. two-storey commercial block with shopfronts -------------------------
for (const [x0, z0, gr] of cells) {
  const x = x0, z = z0, gg = Math.round(gr);
  if (gg > ROOF) continue;
  const e = exp(x, z);

  if (!isRing(x, z)) {
    // interior: storey slab and roof deck, air between
    if (gg + 5 <= 9) put(x, gg + 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // ring (facade) cell
  const corner = (e.n || e.s) && (e.w || e.e);
  const front = e.n && !corner;
  const along = (e.n || e.s) ? x : z;
  const pier = along % 3 === 0;

  for (let y = gg; y <= 9; y++) {
    const d = y - gg;
    let m;
    let p;
    if (d === 0) m = "polished_andesite";                       // plinth / base course
    else if (d === 5) m = "smooth_stone";                       // storey line
    else if (corner) m = "white_terracotta";                    // solid corner piers
    else if (front && x === doorX && (d === 1 || d === 2)) {    // entrance door
      m = "dark_oak_door";
      p = {
        facing: "north",
        half: d === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    }
    else if (front && d === 3) m = "dark_oak_planks";           // shopfront lintel / canopy
    else if (d === 4 || d === 9) m = "white_terracotta";        // spandrel bands
    else if (d >= 1 && d <= 3) m = pier ? "white_terracotta" : "glass";          // shopfront / ground windows
    else if (d >= 6 && d <= 8) m = pier ? "white_terracotta" : "light_blue_stained_glass"; // upper windows
    else m = "white_terracotta";
    put(x, y, z, m, p);
  }

  // cornice and parapet
  put(x, ROOF, z, "smooth_stone");
  put(x, ROOF + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // warm light behind some glass, standing on the interior floor
  if (!corner) {
    const inward = e.n ? [0, 1] : e.s ? [0, -1] : e.w ? [1, 0] : [-1, 0];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !isRing(ix, iz)) {
      const ig = grd(ix, iz);
      // upper storey lamp
      if (along % 6 === 1 && !pier && ig + 6 <= 9 && ig + 6 >= 6 && ig + 6 > gg) {
        put(ix, ig + 6, iz, "glowstone");
      }
      // shopfront lamp on the ground floor
      if (front && along % 6 === 2 && !pier && x !== doorX) {
        put(ix, ig, iz, "shroomlight");
      }
    }
  }
}

// ---- 3. rooftop plant on the roof deck ------------------------------------
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  if (gg > ROOF || isRing(x, z)) continue;
  const inA = x >= 5 && x <= 7 && z >= 4 && z <= 5;
  const inB = x >= 10 && x <= 12 && z >= 10 && z <= 11;
  if (inA || inB) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
