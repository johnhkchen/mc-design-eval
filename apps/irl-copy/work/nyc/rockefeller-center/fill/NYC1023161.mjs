// 1301 Avenue of the Americas, Credit Lyonnais Building: a 1965 Midtown office slab (Commercial & Office Buildings).
// Footprint 94 x 55, lidar roof about 168 blocks (187 m) above its lowest ground, so about 56 storeys of 3 blocks.
// A glass curtain-wall tower of the mid-century Miesian kind: a stone base course and shopfronts at street level,
// a stepped podium that rises in tiers, and a slim tower on top with a mechanical penthouse. Light stone spandrels
// between grey tinted glass bays, dark concrete mullions every third column, a stone lintel over the lobby.
// Lidar roofs are median-smoothed over 5 x 5 and snapped to clean tiers, all multiples of 3:
//   6    low pavilion and plaza-level roofs (lidar under 10)
//   21   low wing (lidar 10-29)
//   36   podium (lidar 30-39)
//   45   podium setback (lidar 40-54)
//   63   midrise (lidar 55-69)
//   81   midrise setback (lidar 70-99)
//   120  shoulder (lidar 100-139)
//   153  tower setback (lidar 140-157)
//   168  tower (lidar 158-170)
// Every column is solid from y 0 up to its top (granite foundation below its ground, then slab rows every 3 blocks),
// so each setback and roof stands on the slab below it. The building is hollow: the glass is the envelope, air sits
// behind it, and a solid floor slab closes every storey (no interiors). Warm glowstone sits behind some panes, on the
// slab, so nothing hangs in the air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023161.cells.json`, "utf8"));
const X = 94, Y = 180, Z = 55;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Median of the footprint's lidar roofs within 2 cells: scattered low noise inside a roof reads as the roof around it.
const median = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) v.push(cell.get(`${x + dx},${z + dz}`).roof);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const TIER = (m) => (m < 10 ? 6 : m < 30 ? 21 : m < 40 ? 36 : m < 55 ? 45 : m < 70 ? 63 : m < 100 ? 81 : m < 140 ? 120 : m < 158 ? 153 : 168);
const raw = new Map([...cell.keys()].map((k) => { const [x, z] = k.split(",").map(Number); return [k, TIER(median(x, z))]; }));
// Spikes and slivers: a cell whose eight neighbours (outside the footprint counts as 0) are mostly lower, with at most
// two as tall as it, drops to the median of them, so a lone lidar column or a one-cell edge strip does not poke up out
// of the podium as a mast. Corners and wall faces (three or more tall neighbours) keep their height. Two passes.
const top = new Map(raw);
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
for (let pass = 0; pass < 2; pass++) for (const [k, T] of [...top]) {
  const [x, z] = k.split(",").map(Number);
  const nb = N8.map(([dx, dz]) => top.get(`${x + dx},${z + dz}`) ?? 0).sort((p, q) => p - q);
  if (nb.filter((t) => t >= T).length <= 2) top.set(k, nb[nb.length >> 1]);
}
// Edge fins: a footprint edge cell standing 40 or more tiers above the cell two inward from it is a lidar smear off the
// neighbouring block, so it takes the inward height and reads as the building's edge, not a mast.
for (const [k] of [...top]) {
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (top.has(`${x + dx},${z + dz}`)) continue;
    const inward = top.get(`${x - 2 * dx},${z - 2 * dz}`);
    if (inward !== undefined && top.get(k) - inward >= 40) top.set(k, inward);
  }
}
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;   // 0 outside the footprint: open air
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([X, Y, Z]);
const M = {
  foundation: "polished_granite", slab: "light_gray_concrete", base: "smooth_quartz", cornice: "smooth_quartz",
  spandrel: "light_gray_concrete", mullion: "gray_concrete", shopMullion: "calcite", glass: "cyan_stained_glass_pane",
  roof: "gray_concrete", penthouse: "light_gray_concrete", lintel: "smooth_quartz", lamp: "glowstone",
};
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const open = (x, y, z) => topAt(x, z) <= y;   // outside the footprint, or on a lower tier, is open at y
const facesAt = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });

// Entrance: on the north (low z) street face, at the middle of the ground-floor frontage that faces north.
const northCols = cols.filter(([x, z]) => !inFoot(x, z - 1) && topAt(x, z) >= 36).map(([x]) => x).sort((a, b) => a - b);
const xm = northCols[northCols.length >> 1];
const zN = Math.min(...cols.filter(([x]) => x === xm).map(([, z]) => z));
const doorAt = (x, y, z) => x === xm && z === zN && (y === 1 || y === 2);
const lintelAt = (x, y, z) => z === zN && Math.abs(x - xm) <= 3 && y === 4;

// 1. Massing: foundation to each cell's ground, then rows of slab every 3 blocks, the envelope between them.
// Each row is a slab (solid across the column) at y % 3 == 0, the roof cap at the top, and a face band elsewhere.
const isFace = (x, y, z) => facesAt(x, y, z).length > 0;
for (const [x, z] of cols) {
  const ground = groundAt(x, z), t = topAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, M.foundation);
  for (let y = ground; y < t; y++) {
    if (y === 0) { g.set(x, y, z, M.foundation); continue; }
    if (y === t - 1) { g.set(x, y, z, M.roof); continue; }                  // roof cap, solid over the whole column
    if (y === t - 2 && isFace(x, y, z)) { g.set(x, y, z, M.cornice); continue; }
    if (y % 3 === 0) { g.set(x, y, z, y === 3 ? M.base : M.slab); continue; } // floor slab: solid, closes the storey
    if (!isFace(x, y, z)) continue;                                           // interior air (no interiors)

    const face = facesAt(x, y, z);
    const d = face.includes("N") || face.includes("S") ? "NS" : "EW";           // dominant face
    const dir = face.find((f) => (d === "NS" ? f === "N" || f === "S" : f === "W" || f === "E"));
    const [dx] = DIRS[dir];
    const u = dx === 0 ? x : z;                                                 // position along the face
    if (doorAt(x, y, z)) continue;                                              // doorway, filled below
    if (lintelAt(x, y, z)) { g.set(x, y, z, M.lintel); continue; }
    if (y < 6 && u % 3 === 0) { g.set(x, y, z, M.shopMullion); continue; }      // shopfront piers
    if (y >= 6 && u % 3 === 0) { g.set(x, y, z, M.mullion); continue; }         // curtain-wall mullions
    g.set(x, y, z, M.glass, dx === 0 ? NS : EW);
  }
}

// 2. Entrance doors: a dark oak door, two blocks tall, on the north face.
const doorStates = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(xm, 1, zN, "dark_oak_door", doorStates("lower"));
g.set(xm, 2, zN, "dark_oak_door", doorStates("upper"));

// 3. Warm light: some panes glow. A glowstone sits in the interior cell behind a pane, on the slab row below it,
// so the lamp is supported. Only on the rows just above a slab (y % 3 == 1).
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;
for (const [x, z] of cols) {
  const t = topAt(x, z);
  for (let y = 1; y < t - 2; y++) {
    if (y % 3 !== 1 || doorAt(x, y, z) || !isFace(x, y, z)) continue;
    const face = facesAt(x, y, z);
    for (const d of face) {
      const [dx, dz] = DIRS[d];
      const ix = x - dx, iz = z - dz;
      if (!inFoot(ix, iz) || topAt(ix, iz) <= y || isFace(ix, y, iz)) continue;   // needs an interior cell behind
      if (lit(x, y, z)) g.set(ix, y, iz, M.lamp);
      break;
    }
  }
}

// 4. Mechanical penthouse on the tower: a set-back box on the 168 tier, its roof cap at the top, a lightning rod on it.
const tower = cols.filter(([x, z]) => topAt(x, z) === 168);
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
const px0 = cx - 9, px1 = cx + 9, pz0 = cz - 5, pz1 = cz + 5;
for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) {
  if (topAt(x, z) !== 168) continue;
  const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
  for (let y = 168; y < 173; y++) {
    if (y === 172) { g.set(x, y, z, M.roof); continue; }                        // roof cap over the whole box
    if (!edge) continue;                                                       // hollow inside
    if (y === 170) { g.set(x, y, z, M.glass, x === px0 || x === px1 ? EW : NS); continue; }
    g.set(x, y, z, M.penthouse);
  }
}
for (let y = 173; y < 176; y++) g.set(cx, y, cz, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
g.set(cx, 176, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1023161.nbt`);
console.log(`NYC1023161: ${stats.blocks} blocks, palette ${stats.palette}, entrance x=${xm} z=${zN}, penthouse centre ${cx},${cz}`);
