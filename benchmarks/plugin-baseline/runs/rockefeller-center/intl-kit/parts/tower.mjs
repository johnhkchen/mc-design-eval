// Revision pass (owner's comment v2), run after every part on the finished grid: plot 0's tower only.
// 1. Rockefeller fluting on every exposed tower face (T1..T4), from the ledge below to the parapet: 1-wide smooth_sandstone
//    piers at the face plane alternating with 1-wide strips recessed 1 (gray stained-glass panes, gray_terracotta spandrel
//    every storey), a lit (about 1 in 5) or dark block behind each pane; corners stay solid piers.
// 2. Each tower ledge (T4 58, T3 104, T2 131, T1 141) floodlit: a flush froglight every 3 in the deck along the foot of the wall.
// 3. Atlas: a bigger meridian ring (11 across) round the sphere, into air only.
// 4. One limestone: cut/chiseled sandstone on the tower above the wings becomes smooth_sandstone.
import { hash3 } from "../vocab/base.mjs";

const LIME = "smooth_sandstone", GLASS = "gray_stained_glass_pane", SPANDREL = "gray_terracotta";
const LIT = "ochre_froglight", DARK = "gray_concrete";
// [x0, x1, z0, z1, top] of the tower masses and their neighbours (shell.mjs M0); the tower is top >= 58
const M0 = [
  [0, 61, 18, 37, 141], [0, 39, 12, 17, 131], [0, 39, 38, 43, 131], [40, 47, 12, 17, 104], [40, 47, 38, 43, 104],
  [48, 53, 12, 17, 58], [48, 53, 38, 43, 58], [14, 47, 22, 33, 147],
  [4, 29, 0, 3, 6], [0, 19, 4, 7, 6], [0, 23, 8, 11, 35], [0, 23, 44, 45, 35], [20, 23, 46, 47, 35],
  [30, 83, 0, 11, 22], [20, 29, 4, 11, 22], [62, 83, 12, 19, 22], [20, 83, 44, 54, 22], [62, 83, 36, 43, 22],
  [32, 81, 2, 11, 26], [22, 31, 6, 11, 26], [62, 81, 12, 17, 26],
  [62, 81, 38, 43, 26], [26, 81, 44, 49, 26], [32, 81, 50, 52, 26],
  [24, 57, 8, 11, 28], [24, 57, 44, 47, 28], [58, 62, 20, 35, 17],
];
const SX = 84, SZ = 55;
const top = new Int16Array(SX * SZ).fill(-1);
for (const [x0, x1, z0, z1, h] of M0) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) top[x * SZ + z] = Math.max(top[x * SZ + z], h);
const H = (x, z) => (x < 0 || z < 0 || x >= SX || z >= SZ ? -1 : top[x * SZ + z]);
const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const tower = (x, z) => H(x, z) >= 58 && H(x, z) !== 147;
// highest course fluted on a tower column: below the crown band on T1, below the parapet band elsewhere
const flutTop = (h) => (h === 141 ? 138 : h - 2);
const exposed = (x, y, z) => DIR.filter(([dx, dz]) => H(x + dx, z + dz) < y);

export function post(g) {
  let strips = 0, lights = 0;
  for (let x = 0; x < SX; x++)
    for (let z = 0; z < SZ; z++) {
      if (!tower(x, z)) continue;
      const h = H(x, z);
      for (const [dx, dz] of DIR) {
        const hn = H(x + dx, z + dz);
        if (hn >= h) continue;
        const y0 = Math.max(hn + 2, 7), y1 = flutTop(h);
        const along = dx === 0 ? x : z;               // the coordinate along this face
        const paneState = dx === 0 ? { east: "true", west: "true" } : { north: "true", south: "true" };
        // base course on the ledge below: solid limestone through the skin
        if (hn >= 6) for (let k = 0; k < 3; k++) g.set(x - dx * k, hn + 1, z - dz * k, LIME);
        for (let y = y0; y <= y1; y++) {
          const corner = exposed(x, y, z).length > 1;
          const inner1 = exposed(x - dx, y, z - dz).length > 0, inner2 = exposed(x - 2 * dx, y, z - 2 * dz).length > 0;
          const strip = along % 2 === 1 && !corner && !inner1 && !inner2;
          if (!strip) { for (let k = 0; k < 3; k++) if (k === 0 || !exposed(x - dx * k, y, z - dz * k).length) g.set(x - dx * k, y, z - dz * k, LIME); continue; }
          g.set(x, y, z, "air");
          if (y % 3 === 1) { g.set(x - dx, y, z - dz, SPANDREL); g.set(x - 2 * dx, y, z - 2 * dz, SPANDREL); continue; }
          g.set(x - dx, y, z - dz, GLASS, paneState);
          const storey = y - ((y + 2) % 3);           // the spandrel row under this window
          const lit = hash3(x * 7 + dx, storey, z * 7 + dz) < 0.2;
          g.set(x - 2 * dx, y, z - 2 * dz, lit ? LIT : DARK);
          g.set(x - 3 * dx, y, z - 3 * dz, g.isAir(x - 3 * dx, y, z - 3 * dz) ? LIME : g.get(x - 3 * dx, y, z - 3 * dz).block);
          strips++;
        }
      }
    }
  // 2. ledge floodlights: deck cells of a tower ledge touching a higher tower wall, every 3 along
  for (let x = 0; x < SX; x++)
    for (let z = 0; z < SZ; z++) {
      const h = H(x, z);
      if (![58, 104, 131, 141].includes(h)) continue;
      const footOfWall = DIR.some(([dx, dz]) => H(x + dx, z + dz) > h);
      const openEdge = DIR.some(([dx, dz]) => H(x + dx, z + dz) < h);
      if (!footOfWall || openEdge || (x + z) % 3 !== 0) continue;
      g.set(x, h, z, LIT); lights++;
    }
  // 3. Atlas: the sphere redrawn open and 11 across: clear the old rings above the figure's shoulders, then thin rings
  const RING = ["minecraft:waxed_exposed_cut_copper", "minecraft:waxed_exposed_copper", "minecraft:lightning_rod"];
  for (let x = 62; x <= 72; x++) for (let y = 11; y <= 22; y++) for (let z = 21; z <= 34; z++)
    if (RING.includes(g.get(x, y, z)?.block)) g.set(x, y, z, "air");
  const C = [67, 16, 27.5], ring = new Map();
  const trace = (ex, u, a, b, mat) => { for (let i = 0; i < 1440; i++) { const t = (2 * Math.PI * i) / 1440;
    const p = [0, 1, 2].map((k) => Math.round(C[k] + a * Math.cos(t) * ex[k] + b * Math.sin(t) * u[k])); if (!ring.has(p.join())) ring.set(p.join(), [p, mat]); } };
  const tilt = (35 * Math.PI) / 180, BR = "waxed_exposed_cut_copper";
  trace([0, 1, 0], [0, 0, 1], 5.5, 5.5, BR);                                   // meridian facing Fifth Avenue (y-z, x 67)
  trace([1, 0, 0], [0, 0, 1], 4, 5.5, BR);                                     // equator (x-z, y 16)
  trace([1, 0, 0], [0, 1, 0], 4, 5.5, BR);                                     // meridian (x-y, z 27/28)
  trace([1, 0, 0], [0, Math.sin(tilt), Math.cos(tilt)], 4, 5.5, "waxed_exposed_copper");   // tilted ecliptic band
  // the tilted axis, perpendicular to the ecliptic, lightning rods beyond each end
  const ax = [0, Math.cos(tilt), -Math.sin(tilt)];
  for (let s = -6.5; s <= 6.5; s += 0.1) { const p = [0, 1, 2].map((k) => Math.round(C[k] + s * ax[k]));
    ring.set(p.join(), [p, Math.abs(s) > 5.8 ? "lightning_rod" : BR]); }
  let ringN = 0;
  for (const [[x, y, z], mat] of ring.values()) if (y >= 11 && y <= 22 && x >= 63 && x <= 71 && z >= 22 && z <= 33 && g.isAir(x, y, z)) { g.set(x, y, z, mat); ringN++; }
  // the lamps the final check stood on the old rings, and a hand cell the old ring held, go; one lantern stands on the new top
  for (let x = 62; x <= 72; x++) for (let y = 11; y <= 23; y++) for (let z = 21; z <= 34; z++)
    if (g.get(x, y, z)?.block === "minecraft:lantern" && g.isAir(x, y - 1, z)) g.set(x, y, z, "air");
  for (let x = 62; x <= 72; x++) for (let y = 11; y <= 22; y++) for (let z = 21; z <= 34; z++) {
    const b = g.get(x, y, z)?.block;
    if (b === "minecraft:brown_terracotta" && [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(([a, c, d]) => g.isAir(x + a, y + c, z + d))) g.set(x, y, z, "air");
  }
  for (let y = 22; y >= 18; y--) if (!g.isAir(67, y, 27) && g.isAir(67, y + 1, 27)) { g.set(67, y + 1, 27, "lantern", { hanging: "false" }); break; }
  console.log(`atlas sphere: ${ringN} ring cells`);
  // 4. one limestone on the tower above the wings
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
    if (!tower(x, z) && H(x, z) !== 147) continue;
    for (let y = 30; y <= 150; y++) {
      const b = g.get(x, y, z)?.block;
      if (b === "minecraft:cut_sandstone" || b === "minecraft:chiseled_sandstone") g.set(x, y, z, LIME);
    }
  }
  console.log(`tower pass: ${strips} strip cells fluted, ${lights} ledge floodlights`);
}
