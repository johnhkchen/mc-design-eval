// Part 6, Furnishings and lighting: picnic tables with umbrellas, overlook benches, lamp posts along every path (every 8
// blocks, alternating sides, one cell off the edge) and at plan.md's fixed spots. Every
// write is checked against the grid first: a cell an earlier part filled is skipped and listed, never refused.
// The hearth campfire is laid by the earthworks' amphitheatre ring; it is placed here only where that ring left air.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { bench, picnicTable, umbrella, lampPost, PICNIC_TABLES, MEADOW_CENTRE, CAMPFIRE_CENTRE, CAMPFIRE_HEARTH } from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const rows = (f) => readFileSync(dir + f, "utf8").trim().split("\n");
const HM = rows("heights.txt").map((r) => [...r].map((c) => parseInt(c, 36)));
const SM = rows("site.txt");
const mapH = (x, z) => HM[Math.min(72, z >> 1)][Math.min(42, x >> 1)];
const siteAt = (x, z) => SM[Math.min(72, z >> 1)][Math.min(42, x >> 1)];

// the same path centrelines and widths as parts/ground.mjs (plan.md's waypoints), for the lamp rhythm
const PATHS = [
  [[[40, 13], [39, 24], [32, 34], [22, 44], [10, 47], [0, 47]], 3],
  [[[62, 13], [63, 28], [58, 40], [52, 50], [42, 60], [32, 67], [26, 70]], 3],
  [[[22, 44], [34, 43], [48, 43], [58, 40]], 3],
  [[[12, 82], [10, 90], [12, 96], [14, 100]], 2],
  [[[32, 77], [40, 82], [48, 87], [48, 91]], 2],
  [[[48, 107], [50, 112], [50, 116]], 2],
  [[[52, 50], [62, 52], [66, 52]], 2],
  [[[22, 84], [26, 92], [34, 98], [40, 98]], 2],
  [[[9, 17], [9, 14], [38, 14]], 2],
];

// Catmull-Rom through the waypoints, sampled every 1/40 of a segment
function ribbon(pts) {
  const n = pts.length, P = [pts[0], ...pts, pts[n - 1]], out = [];
  for (let j = 0; j < n - 1; j++) for (let s = 0; s < 40; s++) {
    const t = s / 40, t2 = t * t, t3 = t2 * t, p = [P[j], P[j + 1], P[j + 2], P[j + 3]];
    out.push([0, 1].map((k) => 0.5 * (2 * p[1][k] + (-p[0][k] + p[2][k]) * t + (2 * p[0][k] - 5 * p[1][k] + 4 * p[2][k] - p[3][k]) * t2 + (-p[0][k] + 3 * p[1][k] - 3 * p[2][k] + p[3][k]) * t3)));
  }
  out.push(pts[n - 1]);
  return out;
}

// cells the paths cover (for keeping lamps and hidden lights off the walks)
const pathCells = new Set();
const samples = PATHS.map(([pts, w]) => {
  const s = ribbon(pts), r = w / 2 + 0.3;
  for (const [px, pz] of s) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = Math.round(px) + dx, z = Math.round(pz) + dz;
    if (Math.hypot(x - px, z - pz) <= r) pathCells.add(`${x},${z}`);
  }
  return { s, w };
});

const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const inRound = (x, z, [cx, cz], r) => Math.hypot(x - cx, z - cz) < r;

// a cell's block name, '' for air or nothing (works on the grid of an earlier part too)
const blockOf = (g, x, y, z) => {
  const b = g.blockAt(x, y, z);
  return typeof b === "string" ? b : b?.block ?? "";
};
const isAir = (g, x, y, z) => !blockOf(g, x, y, z) || /(^|:)(cave_)?air$/.test(blockOf(g, x, y, z));
const allAir = (g, cells) => cells.every(([x, y, z]) => isAir(g, x, y, z));
const cellsBox = (x0, x1, y0, y1, z0, z1) => {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) out.push([x, y, z]);
  return out;
};

export function build(g) {
  const lamps = [], skipped = [];
  const onSite = (x, z) => x >= 2 && x <= 83 && z >= 2 && z <= 143;

  // a lamp post standing on the surface layer y (its base goes at y + 1)
  const lamp = (x, y, z, why) => {
    if (!onSite(x, z)) return false;
    if (!allAir(g, cellsBox(x, x, y + 1, y + 4, z, z))) { skipped.push([x, z, why, "occupied"]); return false; }
    lampPost(g, x, y + 1, z);
    lamps.push([x, z]);
    return true;
  };

  // 1. lamps along every path: every 8 blocks from 4, alternating sides, one cell off the edge
  let pathLamps = 0;
  for (const { s, w } of samples) {
    let total = 0;
    const acc = [0];
    for (let i = 1; i < s.length; i++) { total += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); acc.push(total); }
    let k = 0;
    for (let at = 4; at < total - 2; at += 8, k++) {
      let i = 1;
      while (i < acc.length - 1 && acc[i] < at) i++;
      const [px, pz] = s[i], a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
      const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tx = (b[0] - a[0]) / tl, tz = (b[1] - a[1]) / tl;
      const side = k % 2 ? 1 : -1, d = Math.floor(w / 2) + 1;
      const x = Math.round(px - tz * d * side), z = Math.round(pz + tx * d * side);
      if (pathCells.has(`${x},${z}`)) { skipped.push([x, z, "path lamp", "on a path"]); continue; }
      if (siteAt(x, z) === "B") continue;
      if (lamp(x, mapH(x, z), z, "path")) pathLamps++;
    }
  }

  // 2. the Field Station deck, two lamps at the north corners (deck surface y3)
  lamp(4, 3, 19, "deck");
  lamp(14, 3, 19, "deck");

  // 3. the campfire rim (r 9, rim path surface y7): six lamps clear of the aisles
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    lamp(Math.round(CAMPFIRE_CENTRE[0] + 9 * Math.cos(a)), 7, Math.round(CAMPFIRE_CENTRE[1] + 9 * Math.sin(a)), "campfire rim");
  }

  // 4. the meadow ring's outer edge: eight lamps at r 12.5
  for (let k = 0; k < 8; k++) {
    const a = (k * 45 * Math.PI) / 180, x = Math.round(MEADOW_CENTRE[0] + 12.5 * Math.cos(a)), z = Math.round(MEADOW_CENTRE[1] + 12.5 * Math.sin(a));
    lamp(x, mapH(x, z), z, "meadow ring");
  }

  // 5. the big lawn's margin (x 0..9, z 54..84): lamps on its east edge only, the lawn stays open
  for (const z of [58, 70, 82]) lamp(7, mapH(7, z), z, "big lawn");

  // 6. overlook: lamps at the ends of the seating walls and at the promenade, on each level
  for (const [x, z] of [[5, 96], [41, 96], [3, 103], [43, 103], [42, 109]]) lamp(x, mapH(x, z), z, "overlook");

  // 7. picnic tables on their spots (terrace A y4, terrace C y6), each with an umbrella on the west side
  const colours = ["orange", "white"];
  PICNIC_TABLES.forEach(([x, z], i) => {
    const y = mapH(x, z);   // the surface the ground part laid (terrace heights in plan.md are not yet cut in)
    if (allAir(g, cellsBox(x, x + 1, y + 1, y + 2, z - 1, z + 1))) picnicTable(g, x, y, z);
    else skipped.push([x, z, "picnic table", "occupied"]);
    const ux = x - 1, pole = cellsBox(ux, ux, y + 1, y + 4, z, z);
    if (allAir(g, pole)) umbrella(g, ux, y, z, colours[i % 2]);
    else skipped.push([ux, z, "umbrella", "occupied"]);
  });

  // 8. overlook benches, one row per level, facing north (seat opens north)
  const benches = [[12, 0, 95, 5], [28, 0, 95, 4], [12, 0, 102, 5], [28, 0, 102, 4], [12, 0, 108, 5], [28, 0, 108, 4]];
  for (const [x, , z, len] of benches) {
    const yy = mapH(x, z);
    if (allAir(g, cellsBox(x, x + len - 1, yy + 1, yy + 1, z, z))) bench(g, x, yy, z, len);
    else skipped.push([x, z, "bench", "occupied"]);
  }

  // 10. the hearth: the earthworks' ring normally lays the campfire at plan.md's hearth cell; place it only where air
  const [hx, hy, hz] = CAMPFIRE_HEARTH;
  if (isAir(g, hx, hy, hz)) g.set(hx, hy, hz, "campfire", { lit: "true", signal_fire: "true", waterlogged: "false", facing: "north" });

  console.log(`furnish: ${pathLamps} path lamps, ${lamps.length} lamps in all, ${skipped.length} skipped`);
  if (skipped.length) console.log("furnish skipped:", JSON.stringify(skipped));
}
