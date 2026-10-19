// 1335 Avenue of the Americas (New York Hilton, 1963): a 1960s hotel, a long slab tower on a six-storey podium with a
// low terrace deck to the south. Heights are median-smoothed over 5x5 and snapped to 3-block storeys; cells that are
// barely above their ground are a flat terrace deck. Floor lines and window rows sit on absolute y (y % 3), so every
// column of the block lines up. The shell is a hollow wall ring with a floor slab per storey and a solid cap; a few
// windows carry a glowstone just inside the glass. Entrance: a glass lobby with a double iron door on the podium's north face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1023163.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [127, 147, 54];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const k2 = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const inFp = (x, z) => raw.has(k2(x, z));

// Smoothed ground and top per footprint cell; a top barely above the ground is a deck.
const S = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(raw.get(k2(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const deck = med - g < 4;
  const H = deck ? g + 1 : Math.max(g + 3, Math.min(135, Math.round(med / 3) * 3));
  S.set(key, { g, H, deck });
}
const cell = (x, z) => S.get(k2(x, z));
const occ = (x, z, y) => { const c = cell(x, z); return !!c && !c.deck && y >= c.g && y < c.H; };
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));
const wall = (x, z, y) => occ(x, z, y) && outward(x, z, y).length > 0;

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => { if (y >= 0 && y < SIZE[1] && block) g.set(x, y, z, block, state); };

// Base: granite foundation under the ground, then the shell cell by cell.
for (const [key, { g: gr, H, deck }] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");
  if (deck) { put(x, gr, z, "stone_bricks"); continue; }
  for (let y = gr; y < H; y++) {
    const top = y === H - 1;
    const out = outward(x, z, y);
    if (!out.length) {                                                  // interior: a slab per storey, air between
      if (top) put(x, y, z, "smooth_stone");
      else if (y % 3 === 0) put(x, y, z, "stone");
      continue;
    }
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }       // base course
    if (top || y % 3 === 0) { put(x, y, z, "white_concrete"); continue; } // parapet and storey spandrels
    const [dx, dz] = out[0];
    const u = dx ? z : x;
    const pier = u % 3 === 0;
    if (y < gr + 4 && H <= 24) {                                        // podium ground floor
      const lobby = dz === -1 && x >= 55 && x <= 62;
      if (lobby && (y === gr + 1 || y === gr + 2) && (x === 58 || x === 59)) {
        put(x, y, z, "iron_door", { facing: "south", half: y === gr + 1 ? "lower" : "upper", hinge: x === 58 ? "left" : "right", open: "false", powered: "false" });
      } else if (lobby) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, pier ? "polished_granite" : "black_stained_glass");   // shopfronts
      }
      continue;
    }
    if (y % 36 === 34 && H > 60) { put(x, y, z, "light_gray_concrete"); continue; }   // cornice band every twelve storeys
    const bay = Math.floor(u / 6) % 3 === 1;                              // every third bay of tinted glass
    put(x, y, z, pier ? "light_gray_concrete" : bay ? "gray_stained_glass" : "light_blue_stained_glass");
  }
}

// Warm lamps standing just inside some lower window rows, behind the glass.
for (const [key, { g: gr, H, deck }] of S) {
  if (deck) continue;
  const [x, z] = key.split(",").map(Number);
  for (let y = gr + 1; y < H - 1; y++) {
    if (y % 3 !== 1 || !wall(x, z, y)) continue;
    if ((x * 13 + z * 7 + y * 5) % 17 !== 0) continue;
    const [dx, dz] = outward(x, z, y)[0];
    const ix = x - dx, iz = z - dz;
    if (occ(ix, iz, y) && !wall(ix, iz, y)) put(ix, y, iz, "glowstone");
  }
}

// Roof equipment: small plant boxes scattered over the tower's top.
for (const [key, { H, deck }] of S) {
  if (deck || H < 120) continue;
  const [x, z] = key.split(",").map(Number);
  if (x % 12 === 2 && z % 5 === 2 && !wall(x, z, H - 1)) {
    put(x, H, z, "light_gray_concrete");
    put(x, H + 1, z, "gray_concrete");
  }
}

const top = Math.max(...[...S.values()].map((c) => c.H));
const stats = g.save(`${FILL}/NYC1023163.nbt`);
console.log(JSON.stringify({ footprint: S.size, topY: top, ...stats }));
