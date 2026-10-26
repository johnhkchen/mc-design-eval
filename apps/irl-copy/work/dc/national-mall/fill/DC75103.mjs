// DC75103: a 14 x 9 block Neoclassical government office on the Mall, 1907-era limestone (calcite walls, quartz
// pilasters, smooth quartz string courses and cornice), three storeys over a stone base, a flat roof with a
// parapet, a one-block attic pavilion on the east end, a central double-door entrance on the north (z 1) front.
// Voids are air: each storey is a floor slab with air above it and glass in the ring; lanterns hang behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${OUT}/DC75103.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 14, D = 9, H = 22;
const g = new Voxels([W, H, D]);
const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => footprint.has(`${x},${z}`);

// Facade patterns, one entry per cell along the face. Long faces (N front, S back) run x 0..13, short faces (E, W) z 0..8.
// 'win' = glass between quartz pilasters, 'pier' = pilaster, 'door' = entrance, 'corner' = corner column.
const LONG_N = ["corner", "win", "win", "pier", "win", "win", "door", "door", "win", "win", "pier", "win", "win", "corner"];
const LONG_S = ["corner", "win", "win", "pier", "win", "win", "pier", "pier", "win", "win", "pier", "win", "win", "corner"];
const SHORT  = ["corner", "win", "win", "pier", "win", "win", "pier", "win", "corner"];

// Wall sits on the stone base (y 0). Storey lines: string course y 4, cornice y 8, parapet y 9.
function facadeBlock(face, kind, y) {
  const pane = (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const pillar = ["quartz_pillar", { axis: "y" }];
  if (y === 4 || y === 8) return ["smooth_quartz"];                   // string course, cornice
  if (y === 9) return kind === "win" ? ["calcite"] : pillar;          // parapet
  if (kind === "corner" || kind === "pier") return pillar;
  if (kind === "door") {
    if (y === 1 || y === 2) return ["dark_oak_door", {
      facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
    }];
    return y === 3 ? ["smooth_quartz"] : ["calcite"];                // lintel over the door, wall above it
  }
  // kind === "win"
  if (y === 1) return ["smooth_quartz"];                              // sill (ground storey and above alike)
  if (y === 2 || y === 3 || y === 5 || y === 6 || y === 7) return ["glass_pane", pane];
  return ["calcite"];
}

for (const [x, z] of cells) {
  // Base course on every footprint cell (the foundation from y 0), so every storey stands on solid stone.
  g.set(x, 0, z, "stone_bricks");

  const perim = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  if (perim) {
    // The footprint is the rectangle x 0..13, z 1..8 plus a stub at (0, 0): the north face is row z 1, south row z 8.
    let face, kind;
    if (x === 0 && z === 0) { face = "C"; kind = "corner"; }                                  // the stub's column
    else if ((x === 0 || x === W - 1) && (z === 1 || z === D - 1)) { face = "C"; kind = "corner"; }
    else if (z === 1) { face = "N"; kind = LONG_N[x]; }
    else if (z === D - 1) { face = "S"; kind = LONG_S[x]; }
    else if (x === 0) { face = "W"; kind = SHORT[z]; }
    else { face = "E"; kind = SHORT[z]; }
    for (let y = 1; y <= 9; y++) {
      const [b, s] = facadeBlock(face, kind, y);
      g.set(x, y, z, b, s);
    }
  } else {
    // Interior: a floor slab per storey, air between them. The roof deck is the top of the interior at y 8.
    g.set(x, 4, z, "stone");
    g.set(x, 8, z, "gray_concrete");
  }
}

// The lidar roof is 9 across the building except an attic pavilion over x 11..12, z 2..5 (10): one solid tier at y 9
// on the deck, with a smooth quartz edge.
for (let z = 2; z <= 5; z++) for (let x = 11; x <= 12; x++) {
  const edge = z === 2 || z === 5 || x === 11;
  g.set(x, 9, z, edge ? "smooth_quartz" : "calcite");
}

// Roof equipment: two stone plant boxes on the deck, one block high.
for (const [x0, z0] of [[3, 2], [8, 5]]) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
  g.set(x0 + dx, 9, z0 + dz, "smooth_stone");
}

// Warm lights: lanterns hanging from the storey slabs, just behind some of the glass.
const lantern = { hanging: "true", waterlogged: "false" };
for (const [x, y, z] of [
  [2, 3, 2], [9, 3, 2],                 // north front, ground storey
  [4, 3, 7], [11, 3, 7],                // south back, ground storey
  [1, 3, 4], [12, 3, 4],                // west and east ends, ground storey
  [4, 7, 2], [11, 7, 7],                // upper storey
]) g.set(x, y, z, "lantern", lantern);

const r = g.save(`${OUT}/DC75103.nbt`);
console.log(`DC75103.nbt: ${r.blocks} blocks, palette ${r.palette}`);
