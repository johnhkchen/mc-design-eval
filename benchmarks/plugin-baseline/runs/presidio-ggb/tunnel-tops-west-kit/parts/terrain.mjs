// Terrain and paving (P1): roads, walks, parking, water, pale paths, lawn mound. The ground itself (stone, dirt, grass to
// the heights) is laid by build.mjs from heights.json, which this part also (re)writes from heights-data.mjs.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { moundLawn } from "../vocab.mjs";
import { computeHeights, role, parkway, verge } from "./heights-data.mjs";

export function build(g) {
  const H = computeHeights();
  writeFileSync(fileURLToPath(new URL("../heights.json", import.meta.url)), JSON.stringify(H));
  const top = (x, z) => H[z][x];
  const paint = (x, z, block) => { if (x >= 0 && x < 120 && z >= 0 && z < 146) g.set(x, top(x, z), z, block); };
  const slabAt = (x, y, z, mat) => g.set(x, y, z, ...B.slab(mat, "bottom"));

  // Water: marsh and pond, one block over clay.
  for (let z = 0; z < 146; z++) for (let x = 0; x < 120; x++) {
    if (role(x, z) === "T") { g.set(x, 1, z, "clay"); g.set(x, top(x, z), z, "water"); }
  }
  // Walks: every W cell is smooth stone; roads over it below.
  for (let z = 0; z < 146; z++) for (let x = 0; x < 120; x++) if (role(x, z) === "W") paint(x, z, "smooth_stone");
  for (let z = 22; z <= 77; z++) for (let x = 46; x <= 49; x++) if (role(x, z) !== "T" && top(x, z) <= 4) paint(x, z, "smooth_stone");
  // Pond kerb: the walk ring round it.
  for (let z = 23; z <= 26; z++) for (let x = 37; x <= 40; x++) if (role(x, z) !== "T") paint(x, z, "smooth_stone");

  const road = (x0, z0, x1, z1, onlyW = false) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (!onlyW || role(x, z) === "W") paint(x, z, "gray_concrete");
  };
  // Mason St (z 10..13, yellow centre line z 11..12 where continuous).
  road(8, 10, 27, 13);
  for (let x = 8; x <= 27; x++) { paint(x, 11, "yellow_concrete"); }
  for (let x = 8; x <= 27; x++) { paint(x, 10, "white_concrete"); paint(x, 13, "white_concrete"); }
  // Crissy Field Ave: solid yellow double line z 25..26, white edges z 22, 29.
  road(0, 22, 49, 29);
  for (let x = 0; x <= 49; x++) { paint(x, 25, "yellow_concrete"); paint(x, 26, "yellow_concrete"); paint(x, 22, "white_concrete"); paint(x, 29, "white_concrete"); }
  // The old parking lot is gone: its left-over paving off the highway is a planted verge (grass, the planting part
  // fills it); the edge columns x 0..1 keep their mapped walk paving.
  for (let z = 30; z <= 95; z++) for (let x = 2; x <= 45; x++) if (verge(x, z)) paint(x, z, "grass_block");
  // Presidio Parkway: two 3-lane carriageways (2 in the cut, where the bores fix the width) either side of a concrete
  // median barrier, sweeping in from the west edge and running straight east into the portal. Solid yellow inner edge,
  // solid white outer edge, white lane lines dashed 3 on 3 off, a smooth stone shoulder.
  for (let z = 30; z <= 95; z++) for (let x = 0; x <= 40; x++) {
    const p = parkway(x, z);
    if (!p || (x <= 1 && role(x, z) !== "W")) continue;
    const a = Math.abs(p.d), dash = Math.floor(p.s / 3) & 1;
    let block = "gray_concrete";
    if (a >= p.outer) block = "smooth_stone";
    else if (a >= p.outer - 0.8) block = "white_concrete";
    else if (a >= 1 && a < 1.8) block = "yellow_concrete";
    else if (a >= 3.1 && a < 3.9 && dash) block = "white_concrete";
    else if (p.outer === 8 && a >= 5.1 && a < 5.9 && dash) block = "white_concrete";
    paint(x, z, block);
    if (a < 1 && x >= 2) g.set(x, top(x, z) + 1, z, "polished_andesite");
  }
  // Cut walks (x 26..40) outside the carriageways stay smooth stone.
  for (let z = 76; z <= 95; z++) for (let x = 26; x <= 40; x++) if (!parkway(x, z)) paint(x, z, "smooth_stone");
  // The road runs on through the bores as their floor (x 41..50, both carriageways), its lane line carried in.
  for (const [z0, z1] of [[80, 84], [87, 91]]) for (let z = z0; z <= z1; z++) for (let x = 41; x <= 50; x++) paint(x, z, "gray_concrete");
  for (let x = 41; x <= 50; x++) if (Math.floor((x - 26) / 3) & 1) { paint(x, 82, "white_concrete"); paint(x, 89, "white_concrete"); }
  // Half steps where the road level 4 meets ground at 3 (the west edge columns, the verge round the sweep).
  for (let z = 30; z <= 96; z++) for (let x = 2; x <= 45; x++) {
    if (top(x, z) !== 3 || g.blockAt(x, 3, z) === "minecraft:water") continue;
    const up = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => top(x + dx, z + dz) === 4 && (parkway(x + dx, z + dz) || role(x + dx, z + dz) === "W"));
    if (up && g.isAir(x, 4, z)) slabAt(x, 4, z, role(x, z) === "W" && !verge(x, z) ? "smooth_stone" : "smooth_stone");
  }

  // Pale paths: swept 4-connected along polylines, surface at the ground; a half step wherever the ground rises by 1.
  const swept = (pts, width) => {
    const cells = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      let [x, z] = pts[i]; const [x1, z1] = pts[i + 1];
      cells.push([x, z]);
      while (x !== x1 || z !== z1) {
        const dx = Math.abs(x1 - x), dz = Math.abs(z1 - z);
        if (dx >= dz) x += Math.sign(x1 - x); else z += Math.sign(z1 - z);
        cells.push([x, z]);
      }
    }
    return cells;
  };
  // Corners are rounded (two passes of Chaikin's corner cutting, ends kept), so the long paths sweep instead of kinking.
  const smooth = (pts) => {
    let p = pts;
    for (let k = 0; k < 2 && p.length > 2; k++) {
      const q = [p[0]];
      for (let i = 0; i + 1 < p.length; i++) {
        const [ax, az] = p[i], [bx, bz] = p[i + 1];
        if (i > 0) q.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25]);
        if (i + 2 < p.length) q.push([ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
      }
      q.push(p[p.length - 1]);
      p = q;
    }
    return p.map(([x, z]) => [Math.round(x), Math.round(z)]);
  };
  const path = (raw, width) => {
    const pts = smooth(raw);
    const r0 = -Math.floor((width - 1) / 2), r1 = Math.floor(width / 2);
    const done = new Set();
    for (const [cx, cz] of swept(pts, width)) for (let dz = r0; dz <= r1; dz++) for (let dx = r0; dx <= r1; dx++) {
      const x = cx + dx, z = cz + dz;
      if (x < 0 || x > 119 || z < 0 || z > 145 || role(x, z) === "B" || role(x, z) === "T") continue;
      if (x >= 41 && x <= 50 && z >= 76 && z <= 95) continue;
      const k = x + "," + z; if (done.has(k)) continue; done.add(k);
      paint(x, z, "smooth_sandstone");
    }
    // half steps: the lower neighbour of a 1 rise gets a bottom slab on its own block
    for (const k of done) {
      const [x, z] = k.split(",").map(Number);
      for (const [ax, az] of [[1, 0], [0, 1]]) {
        const nx = x + ax, nz = z + az;
        if (!done.has(nx + "," + nz)) continue;
        const a = top(x, z), b = top(nx, nz);
        if (Math.abs(a - b) === 1) { const [lx, lz] = a < b ? [x, z] : [nx, nz]; const y = Math.min(a, b) + 1; if (g.isAir(lx, y, lz)) slabAt(lx, y, lz, "smooth_sandstone"); }
      }
    }
  };
  const rect = (x0, z0, x1, z1) => path([[x0, (z0 + z1) >> 1], [x1, (z0 + z1) >> 1]], z1 - z0 + 1);
  path([[50, 45], [80, 45], [81, 44], [100, 44], [101, 45], [119, 45]], 3);   // toe path
  rect(62, 58, 119, 60);                                                       // Cliff Walk
  path([[62, 59], [57, 59], [53, 54], [52, 49], [51, 46]], 3);                 // Cliff Walk down the west bluff
  path([[88, 46], [96, 52], [90, 57], [90, 58]], 3);                           // switchback
  path([[64, 60], [64, 88]], 3);                                               // lawn west edge
  path([[64, 87], [119, 87]], 3);                                              // lawn south edge
  path([[56, 107], [40, 112], [24, 118]], 3);
  path([[90, 107], [90, 125], [88, 140]], 3);
  path([[52, 96], [46, 97], [43, 97]], 3);
  path([[63, 76], [58, 80], [55, 86], [55, 94], [54, 103]], 3);                // lid path

  // Big Lawn swell.
  moundLawn(g, 82, 68, 112, 78, 7);
}
