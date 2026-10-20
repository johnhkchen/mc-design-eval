import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 13 x 15 footprint, roof ~11 blocks above lowest ground.
// Read as a 1970s-80s Xinyi-style two-storey commercial block: white render
// facade, stone-brick base, tinted-glass window bands, a shopfront on the
// street (south) face, a stone cornice and parapet, and a rooftop plant room.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039817";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const gmap = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => gmap.has(`${x},${z}`);
const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const interior = (x, z) => has(x, z) && !perim(x, z);
// Street face is south (max z); priority S, N, E, W for corner cells.
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}
// Inward step from a perimeter cell toward the centre of the footprint.
const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

const B = Math.min(...cells.map(([, , gr]) => gr)); // lowest ground: y reference
const TOP = B + 10;                                  // roof deck surface at height 11

function put(x, y, z, spec) {
  if (!spec) return;
  const [name, props] = spec;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

function wallBlock(x, z, y, face, idx, gr) {
  // Entrance door, centred on the street face.
  if (face === "S" && x === 6 && (y === gr + 1 || y === gr + 2)) {
    return ["spruce_door", {
      facing: "south",
      half: y === gr + 1 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    }];
  }
  // Ground storey: shopfront / base.
  if (y <= B + 4) {
    if (y === B + 4) return [face === "S" ? "white_concrete" : "stone_bricks"];
    if (y >= B + 1 && y <= B + 3 && idx % 3 !== 0) return ["glass_pane"];
    return [face === "S" ? "polished_andesite" : "stone_bricks"];
  }
  // Upper storey: white render with tinted window bays and mullions.
  if (y === B + 9) return ["light_gray_concrete"];           // spandrel band
  if (y >= B + 6 && y <= B + 8) {
    return idx % 3 === 0 ? ["light_gray_concrete"] : ["glass_pane"];
  }
  return ["white_concrete"];
}

// 1. Foundations, floors, walls, roof deck and parapet for every footprint cell.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const p = perim(x, z);
  const face = faceOf(x, z);
  const idx = face === "E" || face === "W" ? z : x;
  const floors = [gr, ...[B + 5, B + 10].filter((v) => v > gr)];

  for (let y = gr; y <= TOP; y++) {
    if (floors.includes(y)) {
      let blk = "smooth_stone";                  // floor slab / storey line
      if (y === gr && p) blk = "stone_bricks";   // base course
      if (y === TOP) blk = p ? "smooth_stone" : "light_gray_concrete"; // cornice / roof deck
      g.set(x, y, z, blk);
      continue;
    }
    if (!p) continue;                            // interior stays air behind the glass
    put(x, y, z, wallBlock(x, z, y, face, idx, gr));
  }

  if (p) g.set(x, TOP + 1, z, "stone_bricks");   // parapet
}

// 2. Warm light behind some windows (glowstone in the interior cell next to the glass).
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  const face = faceOf(x, z);
  if (!face) continue;
  const idx = face === "E" || face === "W" ? z : x;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!interior(ix, iz)) continue;
  if (idx % 6 !== 1) continue;
  // Ground-floor glow behind the shopfront glass.
  if (face === "S" && gr < B + 2) g.set(ix, B + 2, iz, "glowstone");
  // Upper-floor glow behind the window bays.
  if (gr < B + 7) g.set(ix, B + 7, iz, "glowstone");
}

// 3. Rooftop equipment standing on the roof deck.
// Mechanical units.
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  if (interior(x, z)) g.set(x, TOP + 1, z, "iron_block");
}
// Plant-room penthouse, 5 x 5 at the centre; solid white ring with a light core.
for (let x = 4; x <= 8; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!interior(x, z)) continue;
    const ring = x === 4 || x === 8 || z === 5 || z === 9;
    for (let y = TOP + 1; y <= TOP + 2; y++) {
      if (ring) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, TOP + 3, z, "smooth_stone");        // roof cap
  }
}
if (interior(6, 7)) g.set(6, TOP + 4, 7, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
