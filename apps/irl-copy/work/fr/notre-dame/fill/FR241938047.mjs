// FR241938047: a 1700 Paris residential block, 7 storeys of pale stone (calcite walls, stone-brick plinth, polished-andesite
// string courses), glazed bays between stone piers, a slate roof with a stone cornice and parapet. Lower wings step down
// by the lidar's roof height; the shell is one block thick, interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938047.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..18, z 0..23

const STOREY = 5, MAX_STOREYS = 7;
const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roof.set(key(x, z), r); }

// Lidar noise: the median of each cell's 3x3 neighbourhood (footprint cells only), then whole storeys
const smoothRoof = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = roof.get(key(x + dx, z + dz)); if (r !== undefined) vals.push(r); }
  vals.sort((a, b) => a - b);
  smoothRoof.set(key(x, z), vals[Math.floor(vals.length / 2)]);
}

// Storeys per cell: enough 5-block storeys to reach the smoothed roof above that cell's ground; 0 = open paved court
const storeys = new Map();
for (const [x, z, g] of cells) {
  const n = Math.min(MAX_STOREYS, Math.max(0, Math.ceil((smoothRoof.get(key(x, z)) - g) / STOREY)));
  storeys.set(key(x, z), n);
}
const nAt = (x, z) => storeys.get(key(x, z)) ?? 0;          // outside the footprint counts as nothing
const gAt = (x, z) => ground.get(key(x, z)) ?? 0;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Faces of a cell at storey k that open onto air or a lower neighbour (the outside of the building there)
const exposed = (x, z, k) => Object.keys(DIRS).filter((d) => nAt(x + DIRS[d][0], z + DIRS[d][1]) <= k);
const inward = { N: "S", S: "N", W: "E", E: "W" };
const DOOR_FACE = "S";

const g = new Voxels([19, 50, 24]);
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Pick the entrance: the street-side (south) ground-storey wall cell nearest the middle of the front
let door = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (nAt(x, z) < 1 || !exposed(x, z, 0).includes(DOOR_FACE) || exposed(x, z, 0).length !== 1) continue;
  if (door === null || Math.abs(x - 9) < Math.abs(door[0] - 9)) door = [x, z];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  const n = nAt(x, z);
  if (n === 0) { g.set(x, gr, z, "smooth_stone"); continue; }          // open paved court
  const top = gr + STOREY * n;

  for (let k = 0; k < n; k++) {
    const base = gr + STOREY * k;
    const faces = exposed(x, z, k);
    if (faces.length === 0) { g.set(x, base, z, k === 0 ? "stone_bricks" : "smooth_stone"); continue; }   // interior: a floor slab only

    // Floor line / string course, then the storey's wall: plinth at the bottom, sills and lintels round the glazed bays
    g.set(x, base, z, k === 0 ? "stone_bricks" : "polished_andesite");
    const wall = (y, block, state) => g.set(x, y, z, block, state);
    if (faces.length > 1) {                                             // corner: quoin, solid
      for (let r = 1; r <= 4; r++) wall(base + r, "stone_bricks");
    } else {
      const face = faces[0];
      const u = face === "N" || face === "S" ? x : z;
      const pier = u % 3 === 0;
      if (pier) {
        for (let r = 1; r <= 4; r++) wall(base + r, "calcite");
      } else {
        wall(base + 1, k === 0 ? "stone_bricks" : "calcite");
        wall(base + 4, "calcite");
        const isDoor = k === 0 && x === door?.[0] && z === door?.[1];
        if (isDoor) {
          wall(base + 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          wall(base + 2, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          wall(base + 3, "lantern", { hanging: "true", waterlogged: "false" });
          wall(base + 4, "stone_bricks");
        } else {
          wall(base + 2, "glass_pane", paneState(face));
          wall(base + 3, "glass_pane", paneState(face));
          // a warm light behind some panes, in the air gap inside the shell
          const [ix, iz] = [x + DIRS[inward[face]][0], z + DIRS[inward[face]][1]];
          if ((x + z + k) % 4 === 0 && nAt(ix, iz) > k && exposed(ix, iz, k).length === 0) {
            g.set(ix, base + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
          }
        }
      }
    }
  }

  // Roof: slate over the top storey; a stone cornice and parapet on the outside edge
  if (exposed(x, z, n - 1).length > 0) {
    g.set(x, top, z, "stone_bricks");
    g.set(x, top + 1, z, "stone_bricks");
  } else {
    g.set(x, top, z, "deepslate_tiles");
    if ((x * 7 + z * 3) % 23 === 0 && n >= 4) {                          // brick flues on the roof
      g.set(x, top + 1, z, "bricks");
      g.set(x, top + 2, z, "bricks");
    }
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241938047.nbt");
console.log(`FR241938047: ${stats.blocks} blocks, palette ${stats.palette}, storeys max ${Math.max(...storeys.values())}, door at ${door}`);
