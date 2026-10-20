import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477002";
const W = 25, H = 76, D = 41;
const ROOF = 64;           // roof surface, relative to lowest ground
const PARAPET = ROOF + 1;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const k2 = (x, z) => `${x},${z}`;
const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(k2(x, z), gr);
const base = new Set(cellG.keys());

function erode(set, k) {
  const out = new Set();
  for (const kk of set) {
    const [x, z] = kk.split(",").map(Number);
    let ok = true;
    for (let dx = -k; dx <= k && ok; dx++)
      for (let dz = -k; dz <= k && ok; dz++)
        if (!set.has(k2(x + dx, z + dz))) ok = false;
    if (ok) out.add(kk);
  }
  return out;
}

// Setback tiers: podium to y44, mid tower to y54, crown to roof 64.
const tiers = [
  { set: base, y0: 0, y1: 44 },
  { set: erode(base, 3), y0: 44, y1: 54 },
  { set: erode(base, 6), y0: 54, y1: ROOF },
];

// Ops store, so pane connections can be resolved before writing.
const ops = new Map();
const put = (x, y, z, id, props) => ops.set(`${x},${y},${z}`, { id, props });
const del = (x, y, z) => ops.delete(`${x},${y},${z}`);
const at = (x, y, z) => ops.get(`${x},${y},${z}`);

const winId = (x, y, z) => {
  if ((x + z) % 3 === 0) return "white_concrete";          // mullion
  const lit = (x * 7 + z * 13 + y * 3) % 11 === 0;         // warm rooms
  return lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane";
};

const mod = (a, n) => ((a % n) + n) % n;
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Foundations: solid from y 0 up to each cell's ground.
for (const [kk, gr] of cellG) {
  const [x, z] = kk.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Facade, floor slabs, storey lines per tier.
for (const t of tiers) {
  const ye = t.y1 - 1;
  for (const kk of t.set) {
    const [x, z] = kk.split(",").map(Number);
    const gc = cellG.get(kk);
    const ys = Math.max(gc, t.y0);
    const perim = NB4.some(([dx, dz]) => !t.set.has(k2(x + dx, z + dz)));
    for (let y = ys; y <= ye; y++) {
      const r = mod(y - 4, 5);
      if (y === gc) {
        put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      } else if (perim) {
        if (y < 4) put(x, y, z, y === 3 ? "smooth_stone" : winId(x, y, z));
        else if (r === 0 || r === 4) put(x, y, z, "white_concrete");
        else put(x, y, z, winId(x, y, z));
      } else if (r === 0 || y === ye) {
        put(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// Roof slab and parapet on the crown tier.
const crown = [...tiers[2].set].map((kk) => kk.split(",").map(Number));
for (const [x, z] of crown) {
  const perim = NB4.some(([dx, dz]) => !tiers[2].set.has(k2(x + dx, z + dz)));
  put(x, ROOF, z, perim ? "white_concrete" : "light_gray_concrete");
  if (perim) {
    put(x, PARAPET, z, (x + z) % 6 === 0 ? "sea_lantern" : "white_concrete");
  }
}

// Roof plant penthouse, centred on the crown.
const mx = crown.reduce((s, c) => s + c[0], 0) / crown.length;
const mz = crown.reduce((s, c) => s + c[1], 0) / crown.length;
const [cx, cz] = crown.reduce((best, c) =>
  Math.hypot(c[0] - mx, c[1] - mz) < Math.hypot(best[0] - mx, best[1] - mz) ? c : best);
const inCrown = (x, z) => tiers[2].set.has(k2(x, z));
for (let x = cx - 4; x <= cx + 4; x++)
  for (let z = cz - 6; z <= cz + 6; z++) {
    if (!inCrown(x, z)) continue;
    const edge = Math.abs(x - cx) === 4 || Math.abs(z - cz) === 6;
    for (let y = PARAPET; y <= ROOF + 3; y++) {
      if (y === PARAPET + 1 && edge) put(x, y, z, "iron_bars");
      else put(x, y, z, "light_gray_concrete");
    }
  }

// Spire mast and tip light.
for (let y = ROOF + 4; y <= 74; y++) put(cx, y, cz, "iron_bars");
put(cx, 75, cz, "end_rod");

// Street entrance on the lowest-z side of the podium.
const T1 = [...tiers[0].set].map((kk) => kk.split(",").map(Number));
const minZ = Math.min(...T1.map((c) => c[1]));
const cand = T1.filter((c) => c[1] === minZ).sort((a, b) => a[0] - b[0]);
const [xe] = cand[Math.floor(cand.length / 2)];
const entrance = cand.filter((c) => Math.abs(c[0] - xe) <= 1);
const ge = Math.max(...entrance.map(([x, z]) => cellG.get(k2(x, z))));
for (const [x] of entrance) {
  for (let y = ge + 1; y <= ge + 2; y++) del(x, y, minZ);
  put(x, ge + 3, minZ, "stone_bricks");
}
put(xe, ge + 2, minZ, "lantern", { hanging: "true" });

// Resolve glass pane connections against neighbouring blocks.
for (const [kk, op] of ops) {
  if (!op.id.endsWith("_stained_glass_pane")) continue;
  const [x, y, z] = kk.split(",").map(Number);
  const has = (dx, dz) => ops.has(`${x + dx},${y},${z + dz}`);
  op.props = {
    north: String(has(0, -1)),
    south: String(has(0, 1)),
    east: String(has(1, 0)),
    west: String(has(-1, 0)),
    waterlogged: "false",
  };
}

// Write the volume.
const g = new Voxels([W, H, D]);
for (const [kk, op] of ops) {
  const [x, y, z] = kk.split(",").map(Number);
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) continue;
  if (op.props) g.set(x, y, z, op.id, op.props);
  else g.set(x, y, z, op.id);
}
g.save(`${DIR}/${ID}.nbt`);
