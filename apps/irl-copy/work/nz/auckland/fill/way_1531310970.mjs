// St Benedict's Convent, Newton (Auckland). Read from the lidar record: a footprint of 385 cells, roofs at 9-11 blocks
// above y 0 (median 11), ground 0-2. Reads as an early-20th-century two-storey plastered convent with a hipped tile
// roof: a stone plinth, a smooth-quartz wall with a string course, timber-framed sash windows in paired bays, a
// stepped brick-tile hip with a flat top and two chimneys. Smoothed to two flat storeys (lidar noise dropped).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1531310970.cells.json", "utf8"));
const g = new Voxels([23, 24, 31]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// y levels: 0-1 plinth; 2 base course; 2-5 ground floor; 6 floor line / string course; 6-9 upper floor;
// 9 cornice; 10-11 roof (eave stairs at 10, second ring at 11); flat top at 12.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inF.has(key(x, z));

// Distance inside the footprint from the outside edge (1 = edge cell): the hip rings.
const dist = new Map(); const queue = [];
for (const [x, z] of cells) {
  if (DIRS.some(([dx, dz]) => !has(x + dx, z + dz))) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) { dist.set(key(nx, nz), d + 1); queue.push([nx, nz]); }
  }
}
const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Plinth: stone from y 0 up through the base, solid under every cell so nothing floats on the slope.
for (const [x, z] of cells) {
  put(x, 0, z, "stone"); put(x, 1, z, "stone");
}

for (const [x, z] of cells) {
  const d = dist.get(key(x, z));
  const outs = outwardOf(x, z);

  if (d === 1) {
    const hasX = outs.some(([dx]) => dx !== 0), hasZ = outs.some(([, dz]) => dz !== 0);
    const corner = hasX && hasZ;
    const face = outs[0];                       // the face this wall cell presents
    const zFace = face[1] !== 0;
    const idx = zFace ? x : z;                  // position along the face
    const inward = [x - face[0], z - face[1]];  // the cell behind the wall

    // Wall column y 2..9 (exterior shell, 1 block thick).
    for (let y = 2; y <= 9; y++) {
      let block = "white_concrete", state;
      if (corner) block = "stone_bricks";
      else if (y === 2) block = "stone_bricks";
      else if (y === 6) block = "quartz_block";
      else if (y === 9) block = "stone_bricks";
      else if ((y >= 3 && y <= 4) || (y >= 7 && y <= 8)) {
        const bay = idx % 4;
        if (bay === 1 || bay === 2) {
          block = "glass_pane";
          state = zFace
            ? { east: "true", west: "true", north: "false", south: "false" }
            : { north: "true", south: "true", east: "false", west: "false" };
        }
      }
      put(x, y, z, block, state);
    }

    // Warm light: a lantern on the floor behind some windows (ground floor y=2, upper floor y=7).
    if (!corner && dist.get(key(inward[0], inward[1])) >= 2) {
      const [ix, iz] = inward;
      if (idx % 8 === 1) put(ix, 2, iz, "lantern", { hanging: "false" });
      if (idx % 8 === 5) put(ix, 7, iz, "lantern", { hanging: "false" });
    }

    // Eave: a tile course on the cornice, sloping down to the outside.
    put(x, 10, z, "brick_stairs", { facing: FACING[`${face[0]},${face[1]}`], half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    // Interior: air behind the walls, a floor slab at y 6, a solid ceiling and roof core from y 10.
    put(x, 6, z, "oak_planks");
    put(x, 10, z, "bricks");
    if (d === 2) {
      // Second hip ring: a stair on the core, low toward the eave.
      const low = DIRS.find(([dx, dz]) => dist.get(key(x + dx, z + dz)) === 1);
      put(x, 11, z, "brick_stairs", { facing: FACING[`${low[0]},${low[1]}`], half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      put(x, 11, z, "bricks");                  // flat top, 12 blocks above y 0
    }
  }
}

// Entrance: a door in the south wall (outward +z), near the middle of the street face, with a stone surround.
const south = cells.filter(([x, z]) => dist.get(key(x, z)) === 1 && !has(x, z + 1));
const midX = Math.round(south.reduce((s, [x]) => s + x, 0) / south.length);
const [dxCell, dzCell] = south.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best));
for (let y = 2; y <= 4; y++) { put(dxCell - 1, y, dzCell, "stone_bricks"); put(dxCell + 1, y, dzCell, "stone_bricks"); }
put(dxCell, 4, dzCell, "stone_bricks");
put(dxCell, 2, dzCell, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dxCell, 3, dzCell, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Roof equipment: two brick chimneys on the flat top, capped with a stone slab.
const flat = cells.filter(([x, z]) => dist.get(key(x, z)) >= 4);
const cx = Math.round(flat.reduce((s, [x]) => s + x, 0) / flat.length);
const cz = Math.round(flat.reduce((s, [, z]) => s + z, 0) / flat.length);
for (const [x, z] of [[cx - 3, cz], [cx + 3, cz - 2]]) {
  if (!has(x, z) || dist.get(key(x, z)) < 3) continue;
  put(x, 12, z, "bricks"); put(x, 13, z, "bricks");
  put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1531310970.nbt";
console.log(g.save(out));
