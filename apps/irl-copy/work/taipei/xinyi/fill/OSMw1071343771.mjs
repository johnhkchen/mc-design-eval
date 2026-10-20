import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343771";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey mid-century commercial block: white-tiled concrete frame, glazed
// shopfront at street level, pilasters, cornice, parapet and rooftop plant.
const W = 11, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, h] of cells) ground.set(key(x, z), h);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front (street) side is the smallest z; the entrance sits on it.
const minZ = Math.min(...cells.map(([, z]) => z));
const doorX = Math.floor(W / 2);

const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

for (const [x, z, base] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // Base course at the ground line.
  g.set(x, base, z, edge ? "polished_andesite" : "light_gray_concrete");

  // Floor slabs: upper floor at base+5, roof deck at base+10 (solid under every cell).
  g.set(x, base + 5, z, "light_gray_concrete");
  g.set(x, base + 10, z, "light_gray_concrete");

  if (!edge) {
    // Interior: air gap behind glass, with a few warm lights on the upper storey.
    if (x % 3 === 1 && z % 3 === 1) g.set(x, base + 7, z, "glowstone");
    continue;
  }

  // Ground storey shopfront: glass bays with quartz pilasters between.
  for (let y = base + 1; y <= base + 3; y++) {
    g.set(x, y, z, (x + z) % 2 === 0 ? "smooth_quartz" : "light_blue_stained_glass");
  }
  // Lintel / fascia over the shopfront.
  g.set(x, base + 4, z, "white_concrete");

  // Upper storey: white tiled wall with a window grid.
  for (let y = base + 6; y <= base + 9; y++) {
    const windowRow = y === base + 7 || y === base + 8;
    const windowCol = (x + z) % 2 === 1;
    g.set(x, y, z, windowRow && windowCol ? "light_blue_stained_glass" : "white_concrete");
  }

  // Cornice band and parapet.
  g.set(x, base + 10, z, "smooth_quartz");
  g.set(x, base + 11, z, "white_concrete");
}

// Entrance on the street face: a double-height glazed door opening, framed by quartz.
{
  const x = doorX, z = minZ;
  if (has(x, z)) {
    const base = ground.get(key(x, z));
    g.set(x, base + 1, z, "spruce_door", { ...DOOR, half: "lower" });
    g.set(x, base + 2, z, "spruce_door", { ...DOOR, half: "upper" });
    g.set(x, base + 3, z, "smooth_quartz");
    // Small projecting canopy over the door, inside the footprint at the lintel line.
    g.set(x, base + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop plant: a small cluster of air-conditioning units on the roof deck.
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  if (has(cx, cz)) {
    const base = ground.get(key(cx, cz));
    g.set(cx, base + 11, cz, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
