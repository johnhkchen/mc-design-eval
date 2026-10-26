import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC79404.cells.json`, "utf8"));

const W = 17, H = 30, D = 16;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Footprint: [x, z, ground, roof] per cell
const cells = new Map();
for (const c of raw) {
  const [x, z, gr, r] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, { x, z, g: Number(gr), r: Number(r) });
}
const inF = (x, z) => cells.has(`${x},${z}`);
const perim = (x, z) => !inF(x + 1, z) || !inF(x - 1, z) || !inF(x, z + 1) || !inF(x, z - 1);

// Smooth roof heights over the footprint, then snap to 3-block storeys
const smoothR = (c) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = `${c.x + dx},${c.z + dz}`;
    if (cells.has(k)) { sum += cells.get(k).r; n++; }
  }
  return n ? sum / n : c.r;
};

// Palette: 1960s-70s Washington office block, pale precast, bronze glazing
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const MULL = "white_concrete";
const SPAN = "light_gray_concrete";
const GLASS = "gray_stained_glass";
const FLOOR = "light_gray_concrete";
const ROOF = "light_gray_concrete";
const CAP = "smooth_stone_slab";
const PENT = "stone_bricks";
const TOPBAND = "quartz_block";

// Front = minimum-z face. Entrance bay: the three front cells nearest the middle.
let minZ = Infinity;
for (const c of cells.values()) if (c.z < minZ) minZ = c.z;
const frontXs = [...cells.values()].filter((c) => c.z === minZ).map((c) => c.x).sort((a, b) => a - b);
const midX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : 0;
const entranceXs = new Set([midX - 1, midX, midX + 1]);
const isEntranceCell = (x, z) => z === minZ && entranceXs.has(x) && frontXs.includes(x);

const info = new Map();

// Massing pass
for (const c of cells.values()) {
  const { x, z } = c;
  const gr = clamp(Math.round(c.g), 0, H - 8);
  const Rs = smoothR(c);
  let n = Math.max(2, Math.round((Rs - gr) / 3));
  if (gr + 3 * n > H - 2) n = Math.max(1, Math.floor((H - 2 - gr) / 3));
  const top = gr + 3 * n;
  const p = perim(x, z);
  info.set(`${x},${z}`, { gr, top, p });

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const zFace = !inF(x, z + 1) || !inF(x, z - 1);
  const xFace = !inF(x + 1, z) || !inF(x - 1, z);

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const band = rel % 3;
    if (!p) {
      if (band === 0) put(x, y, z, FLOOR);
      if (y === top - 1) put(x, y, z, ROOF);
      continue;
    }
    // Entrance bay: stone surround and recessed glass storefront, door in centre
    if (isEntranceCell(x, z) && rel <= 3) {
      if (rel === 0) put(x, y, z, BASE);
      else if (rel === 3) put(x, y, z, BASE);
      else put(x, y, z, GLASS);
      continue;
    }
    if (band === 0) {
      // Base course at ground, spandrels above; top storey gets a quartz band
      const isTop = y >= top - 3;
      put(x, y, z, rel === 0 ? BASE : (isTop ? TOPBAND : SPAN));
    } else {
      let mull = false;
      if (zFace) mull = mull || x % 3 === 0;
      if (xFace) mull = mull || z % 3 === 0;
      put(x, y, z, mull ? MULL : GLASS);
    }
  }

  if (p) {
    put(x, top, z, CAP, { type: "bottom", waterlogged: "false" });
  }
}

// Central mechanical penthouse on the roof (one clean block, not scattered)
{
  let sx = 0, sz = 0, cnt = 0, maxTop = 0;
  for (const c of cells.values()) {
    const inf = info.get(`${c.x},${c.z}`);
    if (!perim(c.x, c.z)) { sx += c.x; sz += c.z; cnt++; }
    maxTop = Math.max(maxTop, inf.top);
  }
  if (cnt > 0) {
    const cx = Math.round(sx / cnt), cz = Math.round(sz / cnt);
    for (let dx = -2; dx <= 1; dx++) for (let dz = -2; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      if (!inF(x, z) || perim(x, z)) continue;
      const inf = info.get(`${x},${z}`);
      if (inf.top + 2 < H) {
        put(x, inf.top, z, PENT);
        put(x, inf.top + 1, z, PENT);
      }
    }
  }
}

// Warm lights behind some windows (shroomlight in the air gap)
for (const c of cells.values()) {
  const { x, z } = c;
  const inf = info.get(`${x},${z}`);
  if (!inf.p || isEntranceCell(x, z)) continue;
  const rel = 1;
  if (((x * 7 + z * 13 + rel) % 11) !== 0) continue;
  const y = inf.gr + rel;
  if (y >= inf.top) continue;
  const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
  for (const [nx, nz] of nbrs) {
    if (!inF(nx, nz) || perim(nx, nz)) continue;
    const ni = info.get(`${nx},${nz}`);
    put(nx, ni.gr + rel, nz, "shroomlight");
    break;
  }
}

// Doors in the centre entrance cell, with a lantern above the lintel
{
  const dx = midX;
  const inf = info.get(`${dx},${minZ}`);
  if (inf) {
    const yLow = inf.gr + 1;
    const yUp = inf.gr + 2;
    put(dx, yLow, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(dx, yUp, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(dx, inf.gr + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC79404.nbt`);
