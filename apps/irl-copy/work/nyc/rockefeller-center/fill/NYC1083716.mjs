// 1185 Avenue of the Americas, 1970: a six-storey Midtown office block on a granite-and-precast base, built to the lot lines.
// The long west face is the avenue front (x = 0): a storefront ground floor with the lobby door at z 13, and precast piers
// between tinted-glass windows above. The south-west end steps down to 16 with a parapet, and the north end is a 1-block
// terrace. A slot at x 1 is open to the ground between the avenue wall and the terrace. Each storey has a spandrel line
// and a floor slab. The inside is air behind the glass, with lit offices on the avenue face and a rooftop plant on the
// upper tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1083716.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 9, Z = 27, Y = 31;
const TALL = 19, SHOULDER = 16;   // the two lidar tiers, in blocks above y 0

// Smoothed roof per cell: the median of the massed cells around it, snapped to the two tiers (19 and 16).
const ground = new Map(), massed = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); if (r > g) massed.set(`${x},${z}`, r); }
const median = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = massed.get(`${x + dx},${z + dz}`); if (v !== undefined) vals.push(v);
  }
  vals.sort((a, b) => a - b); return vals[Math.floor(vals.length / 2)];
};
const T = new Map();   // absolute top of each cell's massing (exclusive), or undefined for no massing
for (const [key, r] of massed) {
  const [x, z] = key.split(",").map(Number); const m = median(x, z);
  T.set(key, m >= 17.5 ? TALL : SHOULDER);
}
const top = (x, z) => {
  const k = `${x},${z}`; if (T.has(k)) return T.get(k);
  return ground.has(k) ? ground.get(k) : 0;                     // a terrace is solid up to its ground; empty cells are air
};
const occ = (x, z, y) => x >= 0 && x < X && z >= 0 && z < Z && y < top(x, z);
const DIRS = { w: [-1, 0], e: [1, 0], n: [0, -1], s: [0, 1] };
const open = (x, z, y, d) => { const [dx, dz] = DIRS[d]; return !occ(x + dx, z + dz, y); };

// Materials: a 1970 precast-and-tinted-glass office, granite base, white piers, grey spandrels, bronze-grey glass.
const BASE = "polished_andesite", PIER = "white_concrete", SPANDREL = "light_gray_concrete", FLOOR = "light_gray_concrete";
const CORNICE = "polished_andesite", ROOF = "gray_concrete", PAVE = "smooth_stone";
const GLASS = "gray_stained_glass_pane", SHOP = "light_blue_stained_glass_pane";
const PANE_X = { north: "true", south: "true", east: "false", west: "false" };   // a pane run along a z-facing wall (the avenue face)
const PANE_Z = { north: "false", south: "false", east: "true", west: "true" };   // a pane run along an x-facing wall (the ends)
const lit = (s, x, z) => (s * 5 + x * 3 + z * 2) % 7 === 0;                       // some offices lit, scattered

const g = new Voxels([X, Y, Z]);
for (const [x, z, gr] of cells) {
  const t = top(x, z), massing = T.has(`${x},${z}`);
  // Foundation: solid from y 0 up to the cell's ground; a terrace's top block is paving.
  for (let y = 0; y < gr; y++) {
    if (!massing && y === gr - 1) g.set(x, y, z, PAVE);
    else g.set(x, y, z, BASE);
  }
  if (!massing) continue;
  for (let y = gr; y < t; y++) {
    const k = y - gr, top1 = y === t - 1;
    const exposed = ["w", "e", "n", "s"].filter((d) => open(x, z, y, d));
    const shell = exposed.length > 0;
    if (!shell) {                                                  // inside: a floor slab per storey, a roof deck, air between
      if (top1) g.set(x, y, z, ROOF);
      else if (k % 3 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (top1) { g.set(x, y, z, CORNICE); continue; }               // parapet with its cornice
    if (k === 0) { g.set(x, y, z, BASE); continue; }               // granite base course
    const xFace = exposed.includes("w") || exposed.includes("e");  // the wall runs along z here
    const street = exposed.includes("w") || z === 0 || z === Z - 1; // the avenue and the end fronts
    const pier = xFace ? z % 3 === 0 || z === Z - 1 : x % 3 === 0 || x === X - 1;
    if (pier) { g.set(x, y, z, PIER); continue; }
    if (k % 3 === 0) { g.set(x, y, z, SPANDREL); continue; }
    if (k < 3 && !street) { g.set(x, y, z, BASE); continue; }     // back of the ground floor: solid granite
    if (k < 3) { g.set(x, y, z, SHOP, xFace ? PANE_X : PANE_Z); continue; }   // storefront glass on the ground floor
    g.set(x, y, z, GLASS, xFace ? PANE_X : PANE_Z);
  }
}

// Lit offices: glowstone just inside the glass on the avenue face, on scattered bays above the ground floor.
for (const [x, z, gr] of cells) {
  if (x !== 0 || !T.has(`${x},${z}`)) continue;
  if (z % 3 === 0 || z === Z - 1) continue;
  for (let s = 1; s * 3 + gr + 1 < T.get(`${x},${z}`) - 1; s++) {
    const y = gr + 3 * s + 1;
    if (lit(s, x, z)) g.set(x + 1, y, z, "glowstone");
  }
}

// The lobby door on the avenue face, with a sign band over it on the storey line.
const LX = 0, LZ = 13, lg = ground.get(`${LX},${LZ}`);
g.set(LX, lg + 1, LZ, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(LX, lg + 2, LZ, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let z = 11; z <= 15; z++) g.set(LX, lg + 3, z, "smooth_stone");

// A service door on the back (east) face.
const SX = 8, SZ = 20, sg = ground.get(`${SX},${SZ}`);
if (T.has(`${SX},${SZ}`)) {
  g.set(SX, sg + 1, SZ, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(SX, sg + 2, SZ, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Rooftop plant on the tall tier, standing on the roof deck.
for (const [x, z] of [[3, 9], [5, 9], [3, 14], [5, 14]]) {
  if (T.get(`${x},${z}`) === TALL) g.set(x, TALL, z, "iron_block");
}

const { blocks, palette } = g.save(`${DIR}/NYC1083716.nbt`);
console.log(`NYC1083716.nbt: ${blocks} blocks, ${palette} palette entries`);
