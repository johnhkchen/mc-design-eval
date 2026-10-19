// 901 D St SW (Commercial-Office-Large), L'Enfant Plaza side of the Mall: a 1960s-70s precast-concrete office block.
// Five office storeys on a 2-block base over a granite plinth, white precast piers between tinted-glass bays, light-grey
// spandrels at each floor line, a cornice, a 2-block penthouse on the taller pavilions, and a lower wing band. Floors are
// slabs on piers (no interiors); the glass is one block thick with an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60046.cells.json`, "utf8"));

// Lidar roof -> clean tiers: 16/17 is one main roof (17), 18/19 the taller pavilions (19), the 5-7 band stays a lower wing.
const tier = (r) => (r >= 18 ? 19 : r >= 16 ? 17 : r);
const FOOT = new Map();
for (const [x, z, g, r] of cells) FOOT.set(`${x},${z}`, { g, r: tier(r) });
const has = (x, z) => FOOT.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const v = new Voxels([52, 31, 23]);
const F = (k) => 2 + 3 * k;                 // floor line of storey k: slab at F, glass at F+1..F+2

// Main entrance: on the north face, in the column nearest mid-plan (the north edge is ragged, so take its first facade cell there).
const cols = [...FOOT.keys()].map((k) => k.split(",").map(Number));
const xMid = Math.round(cols.reduce((s, [x]) => s + x, 0) / cols.length);
const dxCol = [...new Set(cols.map(([x]) => x))].sort((a, b) => Math.abs(a - xMid) - Math.abs(b - xMid))
  .find((x) => cols.some(([cx, cz]) => cx === x && cz === Math.min(...cols.filter(([c]) => c === x).map(([, z]) => z)) && edge(cx, cz)));
const dx = dxCol;
const dz = Math.min(...cols.filter(([x]) => x === dxCol).map(([, z]) => z));

for (const [key, { g, r }] of FOOT) {
  const [x, z] = key.split(",").map(Number);
  const hc = r - 1;                          // top layer: cornice on the facade, roof surface inside
  const facade = edge(x, z);

  // Foundation: solid from y 0 up to the ground (and to the 2-block base where the ground sits lower).
  for (let y = 0; y < 2; y++) v.set(x, y, z, "stone_bricks");
  if (g >= 3) v.set(x, 2, z, "stone_bricks");

  // Floor slabs, one per storey, on the foundation or on the piers below.
  for (let k = 0; F(k) < hc; k++) {
    const f = F(k);
    if (facade && k === 0) v.set(x, f, z, "polished_granite");        // base course
    else v.set(x, f, z, "light_gray_concrete");                       // slab / spandrel
    if (!facade) continue;
    // Bays: a pier every third cell along each facade, glass between, a warm pane here and there.
    const pier = (x + z) % 3 === 0;
    for (const y of [f + 1, f + 2]) {
      if (y >= hc) break;
      if (pier) v.set(x, y, z, "white_concrete");
      else if (y === f + 1 && (x * 5 + z * 3 + k) % 11 === 0) v.set(x, y, z, "glowstone");
      else v.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Piers inside the floor plate, grid-spaced, carry the slabs.
  if (!facade && x % 4 === 2 && z % 4 === 2) for (let y = 2; y < hc; y++) v.set(x, y, z, "white_concrete");

  // Top: cornice on the facade, roof surface inside, plant units on the main roof.
  if (facade) v.set(x, hc, z, "smooth_stone");
  else {
    v.set(x, hc, z, "light_gray_concrete");
    if (r === 17 && x % 7 === 3 && z % 5 === 2) v.set(x, hc + 1, z, "iron_block");
  }
}

// Entrance: a recessed bay of white piers with a double door on the north face, a granite lintel above.
v.set(dx, 3, dz, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(dx, 4, dz, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const ox of [-1, 1]) if (has(dx + ox, dz)) {
  v.set(dx + ox, 3, dz, "white_concrete");
  v.set(dx + ox, 4, dz, "white_concrete");
  v.set(dx + ox, 5, dz, "polished_granite");
}
v.set(dx, 5, dz, "polished_granite");

const out = `${DIR}/DC60046.nbt`;
const res = v.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries, door at ${dx},${dz}`);
