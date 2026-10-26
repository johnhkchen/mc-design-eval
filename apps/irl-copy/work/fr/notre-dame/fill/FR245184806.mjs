// FR245184806: a commercial block of 1900 on the lidar footprint (57 x 33), built to the lidar roof: flat at 8 blocks above y 0
// over most of it, lower wings at 2-6. Walls are limestone (calcite) on a stone foundation and a polished-andesite base course;
// the ground storey is a shopfront with pilasters, lanterns and doors; the upper storey is a window grid of panes in calcite
// piers with smooth-stone string courses; a cornice and parapet close each tier, and deepslate-tile roofs cap the interior.
// Storeys are 4 blocks (ground 2..3 above the base, upper 4..7), so the string course falls on y = 4 and the cornice on the top row.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184806.cells.json`, "utf8"));

const W = 57, H = 24, D = 33;
const STRING = 4;                                   // the storey line: string course over the ground storey

const M = {
  found: "stone_bricks", plinth: "polished_andesite", wall: "calcite", string: "smooth_stone",
  cornice: "smooth_stone", modil: "chiseled_stone_bricks", parapet: "stone_brick_wall", roof: "stone",
  pave: "smooth_stone", column: "calcite", glass: "glass_pane", lamp: "glowstone", lantern: "lantern", chimney: "stone_brick_wall",
};

const fp = new Map();                               // "x,z" -> { g: ground, r: lidar roof, rs: smoothed roof, T: top (blocks above y 0) }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r, rs: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const NEI = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Smooth the lidar: 3x3 median over the footprint (noise cells and the stepped edge), then snap to clean tiers.
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number), v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) v.push(n.r); }
  c.rs = med(v);
}
// A terrace (no real superstructure above the ground) is one paved course; otherwise the roof snaps to 2, 4, 6 or 8.
const tier = (r, g) => (r <= g + 1 ? g + 1 : r >= 7 ? 8 : r >= 5 ? 6 : r >= 3 ? 4 : 2);
for (const c of fp.values()) c.T = tier(c.rs, c.g);

// The sides a cell's walls face: a footprint edge, or a neighbour whose top is lower (a wing stepping down).
const faces = (x, z, c) => Object.entries(NEI).filter(([, [dx, dz]]) => { const n = at(x + dx, z + dz); return !n || n.T < c.T; }).map(([d]) => d);

const g = new Voxels([W, H, D]);
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const G = c.g, T = c.T;
  for (let y = 0; y < G; y++) g.set(x, y, z, M.found);            // foundation up to the ground under the cell
  if (T === G + 1) { g.set(x, G, z, M.pave); continue; }             // a terrace: one paved course on the ground
  const fs = faces(x, z, c), ext = fs.length > 0, face = fs[0];
  const u = face === "north" || face === "south" ? x : z;            // the coordinate along the primary face
  const door = ext && G <= 2 && T >= G + 4 && u % 16 === 8;          // an entrance bay on the ground storey

  if (!ext) {
    // Interior: air rooms, a slab per storey, a column grid on the 6-block bay, and the roof covering the top row.
    if (STRING > G && STRING < T - 1) g.set(x, STRING, z, M.string);
    if (x % 6 === 3 && z % 6 === 3 && T - 1 > G) for (let y = G; y <= T - 2; y++) g.set(x, y, z, M.column);
    g.set(x, T - 1, z, M.roof);
    if (T === 8 && x % 17 === 8 && z % 11 === 5) { g.set(x, T, z, M.chimney); g.set(x, T + 1, z, M.chimney); }
    continue;
  }

  for (let y = G; y < T; y++) {
    if (y === G) { g.set(x, y, z, M.plinth); continue; }             // base course
    if (y === T - 1) { g.set(x, y, z, u % 2 === 0 ? M.modil : M.cornice); continue; }  // cornice with modillions
    if (door && (y === G + 1 || y === G + 2)) {                     // the entrance door, two blocks tall (its head may cut the string)
      const half = y === G + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: face, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y < STRING) {                                                // ground storey: shopfront and pilasters, lanterns by the door
      if (u % 4 === 0) {
        if (u % 8 === 4 && y === G + 1) g.set(x, y, z, M.lantern); else g.set(x, y, z, M.wall);
      } else g.set(x, y, z, M.glass);
      continue;
    }
    if (y === STRING) { g.set(x, y, z, M.string); continue; }        // string course
    if (y >= 5 && y <= T - 2) {                                      // upper storey: calcite piers, panes, a few lit windows
      if (u % 4 === 0) g.set(x, y, z, M.wall);
      else if (((u * 5 + x + z + y) % 11) === 2) g.set(x, y, z, M.lamp);
      else g.set(x, y, z, M.glass);
    }
  }
  if (T >= G + 2) g.set(x, T, z, M.parapet);                         // parapet on the outer edge
}

// Panes join their neighbours: each side is "true" where the next cell is solid or another pane, as the game draws it.
const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const cur = g.get(x, y, z);
  if (!cur || cur.block !== "minecraft:glass_pane") continue;
  const st = {};
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const n = g.get(x + dx, y, z + dz);
    st[side] = n && n.block !== "minecraft:air" && n.block !== "minecraft:cave_air" ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", st);
}

console.log(g.save(`${DIR}/FR245184806.nbt`));
