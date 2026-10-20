import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE93-0168-8F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE93-0168-8F.nbt";

// 2004 eight-storey Xinyi office/commercial block: stone-clad base with a
// lit lobby, glazed tower with white concrete piers, light spandrels,
// cornice, parapet and a roof plant screen with a mast.
const W = 29, H = 52, D = 16;
const STOREYS = 8, STOREY_H = 5;
const TOP = STOREYS * STOREY_H; // 40 blocks above lowest ground

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const base = Math.min(...raw.map(c => c[2]));
const cells = raw.map(([x, z, gr]) => [x, z, gr - base]);
const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gg]) => [key(x, z), gg]));
const has = (x, z) => groundOf.has(key(x, z));

function exposed(x, z) {
  const out = [];
  if (!has(x, z + 1)) out.push("S");
  if (!has(x, z - 1)) out.push("N");
  if (!has(x + 1, z)) out.push("E");
  if (!has(x - 1, z)) out.push("W");
  return out;
}

// Main entrance: lowest-ground south-facing edge cell (fallback any edge cell),
// tie-broken by largest z then nearest the footprint's mean x.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let pool = cells.filter(([x, z]) => exposed(x, z).includes("S"));
if (pool.length === 0) pool = cells.filter(([x, z]) => exposed(x, z).length > 0);
pool.sort((a, b) => a[2] - b[2] || b[1] - a[1] || Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
const doorKey = pool.length ? key(pool[0][0], pool[0][1]) : null;

// Mast cell: footprint cell nearest the centroid.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const mast = [...cells].sort((a, b) =>
  Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

const g = new Voxels([W, H, D]);

function facadeBlock(x, z, r, gg, exp, edge, isDoor) {
  if (!edge) {
    if (r === TOP) return "light_gray_concrete";            // interior roof slab
    if (r > 0 && r % STOREY_H === 0) return "smooth_quartz"; // floor slab
    return null;                                             // air gap
  }
  if (r === TOP) return "smooth_quartz";                     // cornice
  const s = Math.floor(r / STOREY_H), rr = r % STOREY_H;
  const corner = exp.length >= 2;
  const primary = exp[0];
  const u = (primary === "S" || primary === "N") ? x : z;
  const win = (u % 4 === 1 || u % 4 === 2);

  if (s === 0) {
    if (isDoor) {
      // Lobby doorway: glass opening, polished frame, lintel above.
      if (r - gg <= 1) return "glass";
      if (r - gg === 2) return "polished_granite";
    }
    if (rr === 0 || corner) return "polished_granite";       // base course / piers
    return win ? "gray_stained_glass" : "polished_granite";  // shopfront
  }
  if (rr === 0) return "smooth_quartz";                      // storey line (lighter than spandrel)
  if (corner) return "white_concrete";                       // corner piers
  return win ? "light_blue_stained_glass" : "white_concrete";
}

for (const [x, z, gg] of cells) {
  const exp = exposed(x, z);
  const edge = exp.length > 0;
  const isDoor = key(x, z) === doorKey;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone");

  // Facade shell / floor slabs / roof, from ground up to cornice.
  for (let r = gg; r <= TOP; r++) {
    const id = facadeBlock(x, z, r, gg, exp, edge, isDoor);
    if (id) g.set(x, r, z, id);
  }

  if (edge) {
    // Stepped parapet: white concrete coping above the cornice.
    g.set(x, TOP + 1, z, "white_concrete");

    // Entrance lamp: hanging lantern in the lobby above the door.
    if (isDoor) {
      g.set(x, gg + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Warm lights: glowstone behind some lit windows, inside the footprint.
    const primary = exp[0];
    const u = (primary === "S" || primary === "N") ? x : z;
    const win = (u % 4 === 1 || u % 4 === 2);
    for (let st = 1; st < STOREYS; st++) {
      const r = st * STOREY_H + 2;
      if (r < gg || r >= TOP) continue;
      if (!win || exp.length >= 2) continue;
      if ((st * 3 + u) % 5 !== 0) continue;
      let ix = x, iz = z;
      if (primary === "S") iz = z - 1;
      else if (primary === "N") iz = z + 1;
      else if (primary === "E") ix = x - 1;
      else if (primary === "W") ix = x + 1;
      if (!has(ix, iz)) continue;
      if (exposed(ix, iz).length > 0) continue;
      if (r < groundOf.get(key(ix, iz))) continue;
      g.set(ix, r, iz, "glowstone");
    }
  } else {
    // Roof plant: inset stone-brick screen on the upper roof.
    if (x - minX >= 4 && maxX - x >= 4 && z - minZ >= 4 && maxZ - z >= 4) {
      g.set(x, TOP + 1, z, "stone_bricks");
      g.set(x, TOP + 2, z, "stone_bricks");
    }
  }
}

// Central mast on the roof: iron-block core, lightning rod at the tip.
{
  const [mx, mz] = mast;
  for (let r = TOP + 3; r <= TOP + 6; r++) g.set(mx, r, mz, "iron_block");
  g.set(mx, TOP + 7, mz, "lightning_rod");
}

g.save(OUT);
