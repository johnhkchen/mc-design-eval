import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833638";
const W = 17, H = 23, D = 12;

// Record: no tags. Read as a 2-storey, 1970s-80s Taipei low-rise commercial block:
// stone plinth, white rendered walls, light-grey concrete bands, tinted glazing,
// shopfronts at street level, flat concrete roof with plant boxes.
// Storey lines: ground floor 0-4, belt course at 5, upper floor 6-9, cornice at 10, roof at 11.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const OFFSETS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function exposedFaces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(OFFSETS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Upper and ground floor facade decisions for a perimeter cell.
function facade(x, z, faces, y, gr) {
  const isGround = y < 5;

  // Corner or doubly exposed cell: solid pier.
  if (faces.length >= 2) {
    put(x, y, z, "light_gray_concrete");
    return;
  }

  const face = faces[0];
  const alongNS = face === "north" || face === "south";
  const along = alongNS ? x : z;
  const maxAlong = alongNS ? W - 1 : D - 1;
  const isBay = along % 2 === 1 && along > 0 && along < maxAlong;

  // Entrance on the south face at the centre bay.
  if (isGround && face === "south" && z === D - 1 && along === 8 && (y === gr + 1 || y === gr + 2)) {
    const half = y === gr + 1 ? "lower" : "upper";
    put(x, y, z, "dark_oak_door", {
      facing: "south", half, hinge: "left", open: "false", powered: "false",
    });
    return;
  }

  // Ground floor: shopfront glazing below a fascia; upper floor: window bays.
  if (isGround) {
    if (y === gr) { put(x, y, z, "stone_bricks"); return; }
    if (y === 4) { put(x, y, z, "white_concrete"); return; }
    if (isBay) {
      put(x, y, z, "light_blue_stained_glass");
      // Warm light behind the glass on some bays, one block inside the footprint.
      if (along % 4 === 1 && y === gr + 2) {
        const [dx, dz] = OFFSETS[face];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, alongNS ? "light_gray_concrete" : "white_concrete");
    }
    return;
  }

  // Upper floor (6..9): glazing at 7..8, spandrels at 6 and 9.
  if (y === 7 || y === 8) {
    if (isBay) {
      put(x, y, z, "light_blue_stained_glass");
      if (along % 4 === 1 && y === 7) {
        const [dx, dz] = OFFSETS[face];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz)) put(ix, y, iz, "shroomlight");
      }
    } else {
      put(x, y, z, "light_gray_concrete");
    }
  } else {
    put(x, y, z, "white_concrete");
  }
}

for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body from ground up to the roof deck at y 10.
  for (let y = gr; y <= 10; y++) {
    if (y === gr) {
      put(x, y, z, perimeter ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === 5) {
      // Belt course on the facade; floor slab inside.
      put(x, y, z, perimeter ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (y === 10) {
      // Cornice on the facade; roof deck inside.
      put(x, y, z, perimeter ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    if (perimeter) facade(x, z, faces, y, gr);
  }

  // Parapet lip on the perimeter at y 11.
  if (perimeter) put(x, 11, z, "light_gray_concrete");

  // Roof plant boxes on interior cells, sitting on the deck at y 10.
  if (!perimeter && x > 1 && x < W - 2 && z > 1 && z < D - 2 && (x * 3 + z * 5) % 11 === 0) {
    put(x, 11, z, "stone_bricks");
    put(x, 12, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
