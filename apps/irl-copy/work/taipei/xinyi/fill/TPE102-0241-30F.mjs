import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// United Daily News Office Building (聯合報辦公大樓), 2013.
// 29-storey glass-and-white-concrete office tower on a stone plinth:
// full-footprint podium, two stepped setbacks, a crown with a parapet, and a mast.
// Roof is held level at ROOF (absolute y); downhill columns get extra storeys.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0241-30F";
const W = 77, H = 157, D = 44;
const ROOF = 145;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const ground = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.round(gr));
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const inFp = (x, z) => ground.has(key(x, z));
const cx = Math.round((xmin + xmax) / 2);
const cz = Math.round((zmin + zmax) / 2);

// ---- helpers ----------------------------------------------------------------
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const hash = (x, y, z) => ((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) >>> 0;

// Tiers: 0 podium, 1 lower tower, 2 first setback, 3 second setback, 4 crown.
const INSET = [[0, 0], [0, 0], [7, 5], [16, 11], [22, 14]];
const tierFrac = (f) => (f < 0.12 ? 0 : f < 0.5 ? 1 : f < 0.8 ? 2 : f < 0.93 ? 3 : 4);

function tierAt(y, x, z) {
  if (!inFp(x, z)) return -1;
  const t = tierFrac(y / ROOF);
  const [dx, dz] = INSET[t];
  if (x < xmin + dx || x > xmax - dx || z < zmin + dz || z > zmax - dz) return -1;
  return t;
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function isExt(y, x, z) {
  if (tierAt(y, x, z) < 0) return false;
  return NB.some(([a, b]) => tierAt(y, x + a, z + b) < 0);
}

// ---- pass 1: foundations, storeys, walls, terraces --------------------------
const roofInfo = new Map();

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < Math.min(gr, H); y++) put(x, y, z, "stone_bricks");

  let lastYb = null;
  for (let k = 0; ; k++) {
    const yb = gr + STOREY * k;
    if (yb >= ROOF) break;
    const yt = Math.min(yb + STOREY, ROOF);
    const t = tierAt(yb, x, z);
    const pt = k > 0 ? tierAt(yb - STOREY, x, z) : -1;

    if (t >= 0) {
      put(x, yb, z, "light_gray_concrete");
    } else if (pt >= 0) {
      put(x, yb, z, "light_gray_concrete");
      const edge = NB.some(([a, b]) => {
        const nx = x + a, nz = z + b;
        return tierAt(yb, nx, nz) >= 0 || tierAt(yb - STOREY, nx, nz) < 0;
      });
      if (edge) put(x, yb + 1, z, "iron_bars");
    }

    if (t >= 0) {
      const ext = isExt(yb, x, z);
      const xFace = tierAt(yb, x + 1, z) < 0 || tierAt(yb, x - 1, z) < 0;
      const zFace = tierAt(yb, x, z + 1) < 0 || tierAt(yb, x, z - 1) < 0;
      const onZmin = z === zmin && zFace;
      const entranceBay = k === 0 && onZmin && Math.abs(x - cx) <= 4;
      const doorCol = k === 0 && onZmin && Math.abs(x - cx) <= 1;

      for (let j = 1; j < yt - yb; j++) {
        const y = yb + j;
        if (!ext) continue;

        // mullions every 4 cells, so glass bays read as a clear grid
        const mullion = (xFace && zFace) || (xFace && (z - zmin) % 4 === 0) || (zFace && (x - xmin) % 4 === 0);

        if (entranceBay && doorCol && x === cx && (j === 1 || j === 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: j === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (entranceBay && j === 4) {
          // lit canopy soffit over the entrance bay
          put(x, y, z, (x === cx) ? "sea_lantern" : "light_gray_concrete");
        } else if (entranceBay && doorCol && j <= 3) {
          put(x, y, z, "polished_granite");          // door frame
        } else if (entranceBay && j === 1) {
          put(x, y, z, "polished_granite");          // plinth under shopfront
        } else if (mullion) {
          put(x, y, z, "white_concrete");
        } else if (j === 4) {
          put(x, y, z, "light_gray_concrete");        // spandrel
        } else if (k === 0 && j === 1) {
          put(x, y, z, "polished_granite");           // base course
        } else {
          put(x, y, z, "light_blue_stained_glass");
          // warm light behind some panes, in an interior cell
          if (j === 2 && hash(x, y, z) % 11 === 0) {
            const inward = NB.map(([a, b]) => [x + a, z + b])
              .find(([nx, nz]) => tierAt(y, nx, nz) >= 0 && !isExt(y, nx, nz));
            if (inward) put(inward[0], y, inward[1], "glowstone");
          }
        }
      }
    }
    lastYb = yb;
  }

  if (lastYb !== null) {
    const lt = tierAt(lastYb, x, z);
    if (lt >= 0) roofInfo.set(key(x, z), { yb: lastYb, t: lt });
  }
}

// ---- pass 2: roof slab, parapet, crown corners, mast ------------------------
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const info = roofInfo.get(key(x, z));
  if (!info) continue;
  put(x, ROOF, z, "light_gray_concrete");

  if (isExt(info.yb, x, z)) {
    const [dx, dz] = INSET[info.t];
    const corner = (x === xmin + dx || x === xmax - dx) && (z === zmin + dz || z === zmax - dz);
    put(x, ROOF + 1, z, corner ? "sea_lantern" : "white_concrete");
  }
}

const mastInfo = roofInfo.get(key(cx, cz));
if (mastInfo) {
  for (let y = ROOF + 1; y <= ROOF + 7; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
