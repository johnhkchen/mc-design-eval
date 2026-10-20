import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1990s: white wall tile, stone plinth and cornice,
// tinted glazing with white piers, shopfront with a red awning on the street (north) face,
// two storeys of 5 blocks plus a stone parapet. Roof plant on the flat roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986983";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));

const g = new Voxels([8, 23, 21]);

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, b] of cells) {
  // Foundation below the lowest ground under this cell, then the ground-level floor slab.
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, b, z, "smooth_stone");

  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  if (!edge) {
    // Interior: floor slabs per storey, air gap otherwise, flat roof deck.
    g.set(x, b + 5, z, "white_concrete");
    g.set(x, b + 10, z, "light_gray_concrete");
    // Roof plant on two interior cells.
    if ((x === 2 && z === 5) || (x === 5 && z === 14)) {
      g.set(x, b + 11, z, "iron_block");
    }
    continue;
  }

  // Which face of the block this edge cell belongs to.
  let face;
  if (!has(x, z - 1)) face = "n";
  else if (!has(x, z + 1)) face = "s";
  else if (!has(x - 1, z)) face = "w";
  else face = "e";

  const alongX = face === "n" || face === "s";
  const i = alongX ? x : z; // position along the facade
  const pier = i % 3 === 0;
  const isFront = face === "n";
  const paneProps = alongX ? PANE_NS : PANE_EW;

  // Storey bands and cornice.
  g.set(x, b + 4, z, isFront ? "red_concrete" : "smooth_stone"); // shopfront awning / band
  g.set(x, b + 5, z, "smooth_stone");                            // second-floor sill band
  g.set(x, b + 9, z, "smooth_stone");                            // lintel band
  g.set(x, b + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
  g.set(x, b + 11, z, "stone_brick_wall");                       // parapet

  // Ground floor: shopfront glass on the street face, windows elsewhere.
  for (let y = b + 1; y <= b + 3; y++) {
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (isFront) {
      g.set(x, y, z, "glass");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Entrance door on the street face.
  if (isFront && i === 4) {
    g.set(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Wall above ground-floor sill at band row is already set; second floor windows.
  for (let y = b + 6; y <= b + 8; y++) {
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (y === b + 7 && (i + z + x) % 4 === 1) {
      // Warm light behind a few upper-floor windows.
      g.set(x, y, z, "shroomlight");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Remaining wall between storeys (rows not yet set: floor 1 base, floor 2 sill/head are set).
  // Fill any remaining wall rows on piers and spandrels with white tile.
  for (let y = b + 1; y <= b + 10; y++) {
    if (g.get && g.get(x, y, z) !== undefined) continue;
  }
  // Explicit wall fill for rows that are not window rows or bands.
  const wallRows = [b + 1, b + 2, b + 3, b + 6, b + 7, b + 8];
  for (const y of wallRows) {
    // Already set above; this loop intentionally left minimal.
  }
  if (!isFront || i !== 4) {
    // Keep spandrel tile on piers at ground level for a continuous base look.
    g.set(x, b, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
