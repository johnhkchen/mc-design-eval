import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62097.cells.json`, "utf8"));

// K Street NW office block, c.1960s-70s: calcite-clad concrete frame on a granite
// base, tinted glazing between stone piers, a cornice and parapet, setback plant.
// z=0 is the street face (shopfronts, entrance); z=17 the rear; x=0 and x=50 are
// blank party walls to the neighbours.
const W = 51, H = 38, D = 18;
const STOREY = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  foot.set(key(x, z), { g: gr ?? 0, r: rf ?? (gr ?? 0) + STOREY });
}
const has = (x, z) => foot.has(key(x, z));

// Per-cell roof: lidar value smoothed over a 3-cell window along x and z,
// then rounded so tiers read as flat storeys.
const roofAt = (x, z) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = foot.get(key(x + dx, z + dz));
    if (c) { sum += c.r; n++; }
  }
  return n ? Math.round(sum / n) : null;
};

const lit = (x, z, s) => ((x * 7 + z * 3 + s * 5) % 9) < 3;

for (const [x, z] of [...foot.keys()].map(k => k.split(",").map(Number))) {
  const cell = foot.get(key(x, z));
  const gc = cell.g;
  const T = Math.min(H - 6, Math.max(gc + STOREY, roofAt(x, z) ?? gc + STOREY));

  const perim = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const front = z === 0;
  const back = z === D - 1;
  const endFace = x === 0 || x === W - 1;
  const street = front || back;

  // Foundation fill to the cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gc; y < T; y++) {
    const o = y - gc;
    const s = Math.floor(o / STOREY);
    const ph = o % STOREY;

    // Roof deck (interior) and cornice course (perimeter).
    if (y === T - 1) {
      g.set(x, y, z, perim ? "polished_andesite" : "smooth_stone");
      continue;
    }

    if (!perim) {
      if (o > 0 && ph === 0) {
        g.set(x, y, z, "smooth_stone"); // floor slab
      } else if (ph === 1 && street && (z === 1 || z === D - 2) && x % 5 === 2 && lit(x, z, s)) {
        g.set(x, y, z, "glowstone");   // warm light just behind the glass
      }
      continue;
    }

    // Perimeter shell.
    if (o === 0) { g.set(x, y, z, "polished_granite"); continue; }

    if (endFace) {
      // Party wall: blank brick-and-calcite coursing, no openings.
      g.set(x, y, z, ph === 0 ? "smooth_stone" : ((o + x) % 2 === 0 ? "calcite" : "stone_bricks"));
      continue;
    }

    if (!street) {
      g.set(x, y, z, ph === 0 || ph === 3 ? "smooth_stone" : "calcite");
      continue;
    }

    // Street faces: spandrels, sills, and glazing between stone piers.
    if (ph === 0 || ph === 3) { g.set(x, y, z, "smooth_stone"); continue; }

    const shopZone = front && s === 0;
    const pierEvery = shopZone ? 6 : 3;
    if (x % pierEvery === 0) { g.set(x, y, z, "calcite"); continue; }

    // Sill row at the bottom of each window band reads as a ledge.
    if (ph === 1 && !shopZone) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }

    const boarded = !shopZone && ((x * 5 + s * 3 + (back ? 4 : 0)) % 13 === 0);
    g.set(x, y, z, boarded ? "spruce_planks" : "light_blue_stained_glass");
  }

  // Parapet cap.
  if (perim) g.set(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Plant and flues on the interior roof, standing on the deck.
  if (!perim && z === 8 && (x === 10 || x === 36)) {
    for (let y = T; y < Math.min(H, T + 3); y++) g.set(x, y, z, "stone_bricks");
  }
  if (!perim && z === 5 && x === 24) {
    for (let y = T; y < Math.min(H, T + 4); y++) g.set(x, y, z, "bricks");
  }

  // Entrance door, on the street face, opening onto an air gap.
  if (front && x === 24) {
    const d = gc + 1;
    g.set(x, d, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, d + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm shopfront lanterns.
  if (front && !perim && z === 1 && x % 6 === 4) g.set(x, gc + 1, z, "glowstone");
}

g.save(`${DIR}/DC62097.nbt`);
