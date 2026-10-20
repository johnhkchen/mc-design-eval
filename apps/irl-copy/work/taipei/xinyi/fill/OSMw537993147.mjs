import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw537993147.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw537993147.nbt";
const W = 25, H = 47, D = 21;

// Mid-rise (~7 storey) 1980s-90s Taipei office block: white concrete grid, light-blue glass,
// polished granite shopfront base, stepped top with a plant box and corner lights.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const parse = k => k.split(",").map(Number);
const nb4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dirName = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.round(gr));
}

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) throw new Error(`out of bounds ${x},${y},${z}`);
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const L = Math.min(...ground.values());
const M = Math.max(...ground.values());
const B = M;                                  // common floor level (top of highest ground)
const Ytop = Math.min(L + 35, 44);            // roof about 35 above lowest ground
let nS = Math.floor((Ytop - B - 2) / 5);      // storeys of 5 blocks
if (nS < 2) nS = 2;
while (B + 5 * nS + 2 > 46 && nS > 2) nS--;
const ROOF = B + 5 * nS;

// Edge distance inside a set: 1 = facade cell, 2 = next ring, etc.
function edgeDist(set) {
  const d = new Map();
  const q = [];
  for (const k of set) {
    const [x, z] = parse(k);
    if (nb4.some(([dx, dz]) => !set.has(key(x + dx, z + dz)))) { d.set(k, 1); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i];
    const [x, z] = parse(k);
    for (const [dx, dz] of nb4) {
      const n = key(x + dx, z + dz);
      if (set.has(n) && !d.has(n)) { d.set(n, d.get(k) + 1); q.push(n); }
    }
  }
  return d;
}
const outOf = (set, x, z) => nb4.filter(([dx, dz]) => !set.has(key(x + dx, z + dz)));

const full = new Set(ground.keys());
const fullD = edgeDist(full);
const sb = new Set([...full].filter(k => fullD.get(k) >= 2));   // setback tier footprint
const sbD = edgeDist(sb);
const useSB = nS >= 5 && sb.size >= 6;
const S1 = useSB ? nS - 2 : nS;                                  // first setback storey
const tier = s => (s >= S1 ? sb : full);
const tierD = s => (s >= S1 ? sbD : fullD);

// Entrance: highest facade cell (at grade), tie -> min z, then min x
const facadeFull = [...full].filter(k => fullD.get(k) === 1);
facadeFull.sort((a, b) => {
  const ga = ground.get(a), gb = ground.get(b);
  if (ga !== gb) return gb - ga;
  const [ax, az] = parse(a), [bx, bz] = parse(b);
  return az - bz || ax - bx;
});
const entKey = facadeFull[0];
const [ex, ez] = parse(entKey);
const entOut = outOf(full, ex, ez)[0];
const entFacing = dirName[entOut.join(",")];

// 1. Foundations and downhill extra storeys (below floor level B)
for (const k of full) {
  const [x, z] = parse(k);
  const G = ground.get(k);
  for (let y = 0; y < G; y++) put(x, y, z, "stone");
  const isFacade = fullD.get(k) === 1;
  const mull = outOf(full, x, z).length >= 2 || (x + z) % 3 === 0;
  for (let y = G; y < B; y++) {
    const rel = (((y - B) % 5) + 5) % 5;
    if (isFacade) {
      if (rel === 0) put(x, y, z, "light_gray_concrete");
      else if (rel === 4) put(x, y, z, "white_concrete");
      else put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Storey bodies
for (let s = 0; s < nS; s++) {
  const A = tier(s);
  const DD = tierD(s);
  const y0 = B + 5 * s;
  for (const k of A) {
    const [x, z] = parse(k);
    const d = DD.get(k);
    if (d >= 3) {
      for (let y = y0 + 1; y <= y0 + 4; y++) put(x, y, z, "light_gray_concrete");
    } else if (d === 2) {
      // interior gap behind the glass; some warm lights
      if ((x * 7 + z * 3 + s * 5) % 11 === 0) put(x, y0 + 2, z, "glowstone");
    } else {
      // facade
      const outs = outOf(A, x, z);
      const mull = outs.length >= 2 || (x + z) % 3 === 0;
      const isEnt = s === 0 && k === entKey;
      if (isEnt) {
        put(x, y0 + 1, z, "dark_oak_door", { facing: entFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, y0 + 2, z, "dark_oak_door", { facing: entFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
        put(x, y0 + 3, z, "white_concrete");
      } else {
        for (let y = y0 + 1; y <= y0 + 3; y++) {
          put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass");
        }
      }
      const spandrel = s === 0 ? "polished_granite" : (s === nS - 1 ? "smooth_stone" : "light_gray_concrete");
      put(x, y0 + 4, z, spandrel);
    }
  }
}

// 3. Floor slabs and roof slabs on the union of adjacent tiers (nothing unsupported)
for (let s = 0; s <= nS; s++) {
  let cellsHere;
  if (s === nS) cellsHere = new Set(tier(nS - 1));
  else if (s === 0) cellsHere = new Set(full);
  else cellsHere = new Set([...tier(s - 1), ...tier(s)]);
  const mat = s === nS ? "smooth_stone" : "light_gray_concrete";
  for (const k of cellsHere) {
    const [x, z] = parse(k);
    put(x, B + 5 * s, z, mat);
  }
}

// 4. Lower roof edges at the first setback: parapet on the exposed ring
if (useSB) {
  const y = B + 5 * S1 + 1;
  for (const k of full) {
    if (!sb.has(k) && fullD.get(k) === 1) {
      const [x, z] = parse(k);
      put(x, y, z, "smooth_stone");
    }
  }
}

// 5. Top parapet with corner lights, then plant box
const topSet = tier(nS - 1);
const topD = tierD(nS - 1);
for (const k of topSet) {
  const [x, z] = parse(k);
  const d = topD.get(k);
  if (d === 1) {
    const corner = outOf(topSet, x, z).length >= 2;
    put(x, ROOF + 1, z, corner ? "shroomlight" : "smooth_stone");
  } else if (d >= 4) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// 6. Entrance canopy, carried on the lintel above the door
const entPerp = nb4.filter(([dx, dz]) => dx * entOut[0] + dz * entOut[1] === 0);
const canopy = [entKey];
for (const [dx, dz] of entPerp) {
  const n = key(ex + dx, ez + dz);
  if (full.has(n) && fullD.get(n) === 1) canopy.push(n);
}
for (const k of canopy) {
  const [x, z] = parse(k);
  put(x, B + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
