import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541455330";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Two-storey mid-century Taipei commercial block: white tiled facade, grey concrete
// bands, shopfront on the street (north) face, flat roof with parapet at y = 11.
const W = 20, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, h]) => [key(x, z), h - minG]));

const ROOF = 11;                         // parapet top, about 11 blocks above lowest ground
const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const northFace = (z) => z === 0;

const paneNS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Main body: per cell column from its own ground up to the roof.
for (const [x, z] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = ground.get(key(x, z));
  const p = perim(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) { g.set(x, y, z, p ? "stone_bricks" : "smooth_stone"); continue; } // base course / floor
    if (y === 5) { g.set(x, y, z, "smooth_stone"); continue; }                     // storey line + floor slab
    if (y === 10) { g.set(x, y, z, "light_gray_concrete"); continue; }             // roof deck
    if (y === ROOF) { if (p) g.set(x, y, z, "white_terracotta"); continue; }       // parapet
    if (!p) continue;                                                              // interior air

    // Facade wall band.
    const onNorthSouth = z === 0 || z === D - 1;
    const along = onNorthSouth ? x : z;
    const span = onNorthSouth ? W - 1 : D - 1;
    const pilaster = along % 3 === 0 || along === span;
    const windowBand = (y >= gr + 1 && y <= 3) || (y >= 7 && y <= 8);

    if (pilaster) { g.set(x, y, z, "polished_andesite"); continue; }
    if (windowBand) {
      if (z === 0 && y <= 3) {
        g.set(x, y, z, "tinted_glass");                       // shopfront glazing
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", onNorthSouth ? paneNS : paneEW);
      }
      continue;
    }
    g.set(x, y, z, "white_terracotta");
  }
}

// Shopfront entrance: double door on the north face, centred on x 9..10.
for (const x of [9, 10]) {
  const gr = ground.get(key(x, 0));
  if (gr === undefined || gr + 2 > 4) continue;
  const hinge = x === 9 ? "left" : "right";
  g.set(x, gr + 1, 0, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gr + 2, 0, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Warm light behind some upper-storey windows (interior air gap at z = 1).
for (let x = 1; x <= 18; x++) {
  if (x % 3 === 0 || x % 4 !== 2) continue;
  if (!has.has(key(x, 1))) continue;
  const gr = ground.get(key(x, 1));
  if (gr <= 8) g.set(x, 8, 1, "glowstone");
}

// Roof equipment on the deck.
const roofBox = (x0, x1, z0, z1, id, y0 = 11, y1 = 11) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      for (let y = y0; y <= y1; y++)
        if (has.has(key(x, z))) g.set(x, y, z, id);
};
roofBox(3, 5, 3, 4, "light_gray_concrete");            // AC plant
roofBox(3, 5, 3, 4, "iron_bars", 12, 12);              // grille on top
roofBox(14, 15, 5, 6, "iron_block");                   // tank

g.save(`${dir}/${id}.nbt`);
