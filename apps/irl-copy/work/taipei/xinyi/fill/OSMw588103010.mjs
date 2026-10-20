import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi district office / retail block, c. 1995-2005: a four-storey glass-and-
// white-concrete podium carrying a two-storey setback tower with a glowing
// mechanical crown. Six storeys of 5 blocks, roof 31 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588103010";
const W = 49, H = 43, D = 44;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const minG = Math.min(...ground.values());
const gAt = (x, z) => ground.get(key(x, z)) - minG;   // ground relative to lowest ground

const body = new Set(ground.keys());
const g = new Voxels([W, H, D]);

// Materials
const FOUND = "stone_bricks";
const PLINTH = "polished_granite";
const FLOOR = "light_gray_concrete";
const SPAND = "white_concrete";
const GLASS = "light_blue_stained_glass";
const PIER = "smooth_quartz";
const CORNICE = "smooth_quartz";
const GLOW = "glowstone";

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (set, x, z) => set.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isPerim = (set, x, z) => NB.some(([dx, dz]) => !has(set, x + dx, z + dz));
const parse = (k) => k.split(",").map(Number);

// Chebyshev erosion: keep cells whose whole (2r+1) square lies inside the set
const erode = (set, r) => {
  const out = new Set();
  for (const k of set) {
    const [x, z] = parse(k);
    let ok = true;
    for (let dx = -r; dx <= r && ok; dx++)
      for (let dz = -r; dz <= r && ok; dz++)
        if (!has(set, x + dx, z + dz)) ok = false;
    if (ok) out.add(k);
  }
  return out;
};

const tier = erode(body, 6);   // setback tower footprint
const pent = erode(tier, 3);   // mechanical crown footprint

// Foundations: solid from y 0 up to each cell's ground
for (const k of body) {
  const [x, z] = parse(k);
  for (let y = 0; y <= gAt(x, z); y++) put(x, y, z, FOUND);
}

// Storey builder. Levels are absolute slab rows; each cell's lowest level is
// its own ground (or the tier start). Floors span the set; facades on the edge.
function block(set, startOf, bounds, isGroundFloor) {
  for (const k of set) {
    const [x, z] = parse(k);
    const s = startOf(x, z);
    const lv = [s, ...bounds.filter((L) => L > s)];

    // floor slabs
    for (const L of bounds) if (L > s) put(x, L, z, FLOOR);

    const perim = isPerim(set, x, z);
    const axisNS = !has(set, x, z - 1) || !has(set, x, z + 1);
    const axisEW = !has(set, x - 1, z) || !has(set, x + 1, z);
    const corner = axisNS && axisEW;
    const idx = axisNS ? x : z;
    const pier = corner || idx % 3 === 0;

    // inward direction (for lights behind the glass)
    let ix = 0, iz = 0;
    if (!has(set, x, z - 1)) iz = 1;
    else if (!has(set, x, z + 1)) iz = -1;
    else if (!has(set, x - 1, z)) ix = 1;
    else if (!has(set, x + 1, z)) ix = -1;

    if (!perim) continue;

    for (let i = 0; i < lv.length - 1; i++) {
      const lo = lv[i], hi = lv[i + 1];
      if (hi - lo < 2) continue;
      const storey = i;
      const ground = isGroundFloor && (lo === s || lo === 1);

      if (bounds.includes(lo)) put(x, lo, z, SPAND);
      for (let r = lo + 1; r < hi; r++) {
        if (ground && r === lo + 1) {
          put(x, r, z, PLINTH);
        } else if (pier) {
          put(x, r, z, PIER);
        } else {
          put(x, r, z, GLASS);
          if (r === hi - 2 && (idx + storey) % 3 === 0 && has(set, x + ix, z + iz)) {
            put(x + ix, r, z + iz, GLOW);
          }
        }
      }
      if (bounds.includes(hi)) put(x, hi, z, SPAND);
    }
  }
}

// Podium: four storeys on the full footprint, roof slab at 21
block(body, (x, z) => gAt(x, z), [1, 6, 11, 16, 21], true);

// Setback tower: two storeys from the podium roof, slabs at 26 and 31
block(tier, () => 21, [26, 31], false);

// Podium roof parapet on edge cells not under the tower
for (const k of body) {
  const [x, z] = parse(k);
  if (!has(tier, x, z) && isPerim(body, x, z)) put(x, 22, z, SPAND);
}

// Tower cornice
for (const k of tier) {
  const [x, z] = parse(k);
  if (isPerim(tier, x, z)) put(x, 32, z, CORNICE);
}

// Mechanical crown: glazed drum with a cornice, roof at 35, glowing corners at 36
if (pent.size) {
  for (const k of pent) {
    const [x, z] = parse(k);
    const perim = isPerim(pent, x, z);
    put(x, 35, z, FLOOR);
    if (perim) {
      put(x, 32, z, SPAND);
      put(x, 35, z, SPAND);
      const axisNS = !has(pent, x, z - 1) || !has(pent, x, z + 1);
      const axisEW = !has(pent, x - 1, z) || !has(pent, x + 1, z);
      const idx = axisNS ? x : z;
      for (let r = 33; r <= 34; r++) put(x, r, z, idx % 3 === 0 || (axisNS && axisEW) ? PIER : GLASS);
      if (axisNS && axisEW) put(x, 36, z, GLOW);
    }
  }
}

// Entrance on the south-facing ground edge nearest the middle of the block
{
  const cands = [];
  for (const k of body) {
    const [x, z] = parse(k);
    if (gAt(x, z) === 0 && isPerim(body, x, z)) cands.push([x, z]);
  }
  const cx = [...body].map((k) => parse(k)[0]).reduce((a, b) => a + b, 0) / body.size;
  const south = cands.filter(([x, z]) => !has(body, x, z + 1));
  const pool = (south.length ? south : cands).sort(
    (a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx)
  );
  if (pool.length) {
    const [x, z] = pool[0];
    let facing = "south";
    if (!has(body, x, z + 1)) facing = "south";
    else if (!has(body, x, z - 1)) facing = "north";
    else if (!has(body, x + 1, z)) facing = "east";
    else facing = "west";

    put(x, 2, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

    // lintel and canopy line over the door, spanning the facade
    const along = facing === "north" || facing === "south" ? [1, 0] : [0, 1];
    for (const s of [-1, 0, 1]) {
      const lx = x + along[0] * s, lz = z + along[1] * s;
      if (has(body, lx, lz)) put(lx, 4, lz, PIER);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
