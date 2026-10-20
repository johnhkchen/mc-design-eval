import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1001352.cells.json`, "utf8"));

const W = 44, H = 43, D = 67;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const raw = new Map(); // "x,z" -> { ground, roof }
for (const c of cells) {
  const [x, z, gr, rr] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  const k = `${x},${z}`;
  const prev = raw.get(k);
  if (!prev) raw.set(k, { ground: gr, roof: rr });
  else raw.set(k, { ground: Math.max(prev.ground, gr), roof: Math.max(prev.roof, rr) });
}
const has = (x, z) => raw.has(`${x},${z}`);

// centre of footprint in x (for the street entrance)
let sx = 0, n = 0;
for (const k of raw.keys()) { sx += Number(k.split(",")[0]); n++; }
const cx = Math.round(sx / n);

// ---- smooth ground and roof over a neighbourhood, quantise to tiers ---------
const R = 3;
function smoothed(field) {
  const out = new Map();
  for (const [k] of raw) {
    const [x, z] = k.split(",").map(Number);
    let sum = 0, cnt = 0;
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const kk = `${x + dx},${z + dz}`;
      if (raw.has(kk)) { sum += field(raw.get(kk)); cnt++; }
    }
    out.set(k, sum / cnt);
  }
  return out;
}
const groundS = smoothed(v => v.ground);
const roofS = smoothed(v => v.roof);

const cellGround = new Map();
const tops = new Map();
for (const [k] of raw) {
  const ground = Math.max(0, Math.round(groundS.get(k)));
  cellGround.set(k, ground);
  // flat tiers every 2 blocks, at least 4 blocks above the cell's ground
  const t = Math.min(H - 8, Math.max(ground + 4, 2 * Math.round(roofS.get(k) / 2)));
  tops.set(k, t);
}

function set(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// ---- main massing -----------------------------------------------------------
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number);
  const ground = cellGround.get(k);
  const top = tops.get(k);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) set(x, y, z, "stone");

  const zFace = !has(x, z - 1) || !has(x, z + 1); // wall faces along x
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const edge = zFace || xFace;
  const idx = zFace ? x : z;

  // inward direction for warm lights behind glass
  let inx = 0, inz = 0;
  if (!has(x - 1, z)) inx = 1; else if (!has(x + 1, z)) inx = -1;
  if (!has(x, z - 1)) inz = 1; else if (!has(x, z + 1)) inz = -1;
  if (zFace && !xFace) inx = 0;
  if (xFace && !zFace) inz = 0;
  const hasInterior = has(x + inx, z + inz) && (inx !== 0 || inz !== 0);

  // street entrance: centred on the low-z face
  const entrance = !has(x, z - 1) && Math.abs(x - cx) <= 3;

  for (let y = ground; y < top; y++) {
    const rel = y - ground;

    // roof slab / parapet cap
    if (y === top - 1) {
      set(x, y, z, edge ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    // interior: floor slabs only, air otherwise
    if (!edge) {
      if (rel % 2 === 0) set(x, y, z, "light_gray_concrete");
      continue;
    }

    // facade
    if (rel === 0) {
      set(x, y, z, "polished_granite");
      continue;
    }

    if (entrance && zFace) {
      if (rel === 1 || rel === 2) {
        // doorway opening, lanterns flanking it
        if (rel === 1 && (x === cx - 3 || x === cx + 3)) {
          set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        }
        continue;
      }
      if (rel === 3) {
        set(x, y, z, "smooth_stone");
        continue;
      }
    }

    if (rel === 1) {
      // shopfront glazing with granite mullions
      set(x, y, z, idx % 3 === 0 ? "polished_granite" : "light_blue_stained_glass");
      continue;
    }

    if (rel % 2 === 0) {
      // floor-line spandrel band
      set(x, y, z, "white_concrete");
      continue;
    }

    // window row: precast mullions every third block, pale glazing between
    if (idx % 3 === 0) {
      set(x, y, z, "light_gray_concrete");
    } else {
      set(x, y, z, "light_blue_stained_glass");
      // warm light glowing from behind some panes
      if (hasInterior && idx % 9 === 4) {
        set(x + inx, y, z + inz, "shroomlight");
      }
    }
  }
}

// ---- mechanical penthouse on the roof -----------------------------------------
for (let x = 9; x <= 34; x++) {
  for (let z = 12; z <= 54; z++) {
    if (!has(x, z)) continue;
    const top = tops.get(`${x},${z}`);
    const ring = x === 9 || x === 34 || z === 12 || z === 54;
    const idx = (z === 12 || z === 54) ? x : z;
    for (let rel = 0; rel < 4; rel++) {
      const y = top + rel;
      if (y >= H) continue;
      if (rel === 3) { set(x, y, z, "smooth_stone"); continue; }
      if (!ring) continue;
      if (rel === 1) {
        set(x, y, z, idx % 3 === 0 ? "light_gray_concrete" : "iron_bars");
      } else {
        set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${dir}/NYC1001352.nbt`);
