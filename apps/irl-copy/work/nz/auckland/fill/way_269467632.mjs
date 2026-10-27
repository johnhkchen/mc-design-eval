import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s stripped-Classical block of reinforced concrete with cream plaster (Eden Terrace / Newton's street-front
// blocks of the period), three storeys on the main tier, a two-storey wing where the lidar drops to 10, and a
// one-storey tier at 8. Black glazed shopfronts on the N and W (street) faces, steel windows elsewhere, a cornice on
// every tier, a plant box on the roof, a canopied entrance. The lidar roof is smoothed into three flat tiers (solid to
// top-1: 12, 10, 8), and every cell is solid from y 0 up, so nothing floats. Each window is a glass pane with one air
// cell behind it (a floor slab each side), and some windows have a glowstone lamp in that cell.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269467632.cells.json`, "utf8"));
const SIZE = [38, 25, 29];

// the lidar roof -> a flat tier
const tier = (r) => (r >= 11 ? 12 : r >= 9 ? 10 : 8);
const FOOT = new Map();
for (const [x, z, ground, roof] of cells) FOOT.set(`${x},${z}`, { ground, top: tier(roof) });
const K = (x, z) => `${x},${z}`;
const K3 = (x, y, z) => `${x},${y},${z}`;
const cellAt = (x, z) => FOOT.get(K(x, z));
const inF = (x, z) => FOOT.has(K(x, z));
const inBox = (x, z) => x >= 0 && z >= 0 && x < SIZE[0] && z < SIZE[2];

const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const SHOP = new Set(["N", "W"]);
const PLASTER = "smooth_quartz";   // the cream plaster of the walls (white_terracotta rendered salmon, not cream)
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);

// a cell's visible faces: outside the footprint (lo 0), or against a lower tier (lo = that tier's top: a setback step)
const facesOf = (x, z) => {
  const me = cellAt(x, z), out = [];
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d], n = cellAt(x + dx, z + dz);
    if (!n) out.push({ d, lo: 0 });
    else if (n.top < me.top) out.push({ d, lo: n.top });
  }
  return out;
};

// the entrance: on a shopfront face of the main tier, in the middle of the run, with room for its canopy inside the box
const cellList = [...FOOT.keys()].map((k) => { const [x, z] = k.split(",").map(Number); return [x, z, cellAt(x, z)]; });
const entryCands = cellList
  .filter(([x, z, c]) => c.top === 12 && facesOf(x, z).some((f) => f.lo === 0 && SHOP.has(f.d)))
  .map(([x, z]) => {
    const f = facesOf(x, z).find((f) => f.lo === 0 && SHOP.has(f.d));
    const [dx, dz] = DIRS[f.d];
    return { x, z, d: f.d, room: inBox(x + 2 * dx, z + 2 * dz) };
  })
  .filter((e) => e.room)
  .sort((a, b) => a.x - b.x || a.z - b.z);
const EN = entryCands[Math.floor(entryCands.length / 2)];

// one cell's facade at height y: the strongest rule among its faces (door > glass > trim > plaster)
function skinAt(x, z, y, F, t, g) {
  let best = { rank: 0, block: PLASTER, state: null, glass: false, d: null };
  const offer = (rank, block, state = null, glass = false, d = null) => {
    if (rank > best.rank) best = { rank, block, state, glass, d };
  };
  for (const { d, lo } of F) {
    if (y < lo) continue;
    const out = lo === 0, shop = out && SHOP.has(d), base = out ? g : lo;
    const bay = along(d, x, z) % 3 !== 0;   // a pier every third cell
    if (y === t - 1) { offer(2, "stone_bricks"); continue; }                        // cornice
    if (y === base) { offer(2, "stone_bricks"); continue; }                         // base course / ledge
    if (y === 3 || y === 7) { offer(2, shop && y === 3 ? "black_glazed_terracotta" : "stone_bricks"); continue; } // storey lines
    if (out && d === EN.d && x === EN.x && z === EN.z && (y === g + 1 || y === g + 2)) {
      offer(6, "dark_oak_door", { facing: { N: "north", E: "east", S: "south", W: "west" }[d], half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 4 || y === 8) { if (bay) offer(2, "stone_bricks"); continue; }      // sills
    const row = y === 1 || y === 2 ? 1 : y === 5 || y === 6 ? 2 : y === 9 || y === 10 ? 3 : 0;
    if (row && out) {
      if (bay) offer(4, "glass_pane", null, true, d);
      else if (shop && row === 1) offer(3, "black_glazed_terracotta");               // shopfront pilasters
    } else if (row && bay) offer(4, "glass_pane", null, true, d);                   // step faces: windows above the lower tier
  }
  return best;
}

const solid = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => solid.set(K3(x, y, z), { block, state: state ?? null });
const glass = new Map();   // "x,y,z" -> the face the pane looks out of
for (const [x, z, c] of cellList) {
  const { ground: g, top: t } = c, F = facesOf(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                                 // foundation
    if (!F.length) { put(x, y, z, y === t - 1 ? "smooth_stone" : PLASTER); continue; } // solid interior
    const s = skinAt(x, z, y, F, t, g);
    put(x, y, z, s.block, s.state);
    if (s.glass) glass.set(K3(x, y, z), s.d);
  }
}

// an air gap behind each window (its inward cell, when that cell is interior), and a glowstone lamp in some of them
const lit = (x, y, z) => (y === 5 || y === 9) && (x * 3 + z * 5 + y) % 7 === 0;
for (const [k, d] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  if (!d) continue;
  const [dx, dz] = DIRS[d], px = x - dx, pz = z - dz, pc = cellAt(px, pz);
  if (!pc || facesOf(px, pz).length || pc.top <= y || pc.ground > y) continue;
  solid.delete(K3(px, y, pz));
  if (lit(x, y, z)) put(px, y, pz, "glowstone");
}

// glass pane connections: a pane joins the solid blocks beside it in its own plane
for (const [k, d] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const link = (a, b) => (solid.has(K3(a, y, b)) ? "true" : "false");
  const planeX = d === "N" || d === "S";
  const state = planeX
    ? { north: "false", south: "false", east: link(x + 1, z), west: link(x - 1, z) }
    : { north: link(x, z - 1), south: link(x, z + 1), east: "false", west: "false" };
  put(x, y, z, "glass_pane", state);
}

// the canopy over the entrance, on two posts, with a lantern hung under its corner
// (k = steps out from the wall, a = steps along it)
const eg = cellAt(EN.x, EN.z).ground;
const [edx, edz] = DIRS[EN.d];
const outAt = (k, a) => [EN.x + edx * k + (edz !== 0 ? a : 0), EN.z + edz * k + (edx !== 0 ? a : 0)];
for (const a of [-1, 0, 1]) for (const k of [1, 2]) {
  const [px, pz] = outAt(k, a);
  if (inBox(px, pz) && !inF(px, pz)) put(px, eg + 3, pz, "stone_bricks");
}
for (const a of [-1, 1]) {
  const [px, pz] = outAt(2, a);
  if (inBox(px, pz) && !inF(px, pz)) {
    put(px, eg, pz, "stone_bricks");
    put(px, eg + 1, pz, "iron_bars", { north: "false", south: "false", east: "false", west: "false" });
    put(px, eg + 2, pz, "iron_bars", { north: "false", south: "false", east: "false", west: "false" });
  }
}
const [lx, lz] = outAt(1, -1);
put(lx, eg + 2, lz, "lantern", { hanging: "true" });

// the roof plant: two 2 x 2 boxes on the main tier's interior, apart from each other
const roofAt = (x, z) => cellAt(x, z)?.top === 12 && facesOf(x, z).length === 0;
const sq = cellList.filter(([x, z]) => roofAt(x, z) && roofAt(x + 1, z) && roofAt(x, z + 1) && roofAt(x + 1, z + 1));
const cx = sq.reduce((s, [x]) => s + x, 0) / sq.length, cz = sq.reduce((s, [, z]) => s + z, 0) / sq.length;
const pick = [];
for (const [x, z] of sq.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))) {
  if (pick.every(([px, pz]) => Math.abs(px - x) + Math.abs(pz - z) >= 6)) pick.push([x, z]);
  if (pick.length === 2) break;
}
for (const [x, z] of pick) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + a, 12, z + b, "light_gray_concrete");

const g = new Voxels(SIZE);
for (const [k, { block, state }] of solid) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state ?? undefined); }
const out = g.save(`${DIR}/way_269467632.nbt`);
console.log(JSON.stringify({ entrance: EN, blocks: out.blocks, palette: out.palette, roofPlant: pick }));
