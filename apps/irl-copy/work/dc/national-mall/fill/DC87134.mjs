import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87134.cells.json`, "utf8"));

// Footprint 4 x 15: a Federal-style brick office block with a stone base,
// stone pilasters between glazed bays, a full-width shopfront at street level,
// smooth-stone floor bands, a stone parapet and a recessed entrance.
const W = 4, H = 29, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => footprint.has(key(x, z));
const perimeter = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const G0 = Math.min(...cells.map(c => c[2]));

const paneProps = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance cell on the west face at z = 7, if it exists.
const entranceCell = cells.find(c => c[0] === 0 && c[1] === 7);
const entranceZ = 7;

for (const [x, z, gr, roof] of cells) {
  const P = perimeter(x, z);
  const onLongFace = (x === 0 || x === 3) && z >= 1 && z <= 13;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floor bands and interior air up to the roof line.
  for (let y = gr; y < roof; y++) {
    const rel = y - G0;
    const off = ((rel % 4) + 4) % 4;
    const k = Math.floor(rel / 4);

    // Floor slab at each storey line (k >= 1), spanning the whole footprint.
    if (off === 0 && k >= 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (P) {
      // Stone base course at the bottom of the walls.
      if (off === 0 && k === 0) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }

      const bandRow = off === 1 || off === 2;

      if (onLongFace && bandRow) {
        if (k === 0) {
          // Street-level shopfront: continuous glass, with the entrance cut into it.
          if (z === entranceZ && x === 0) {
            // handled below by the entrance block
            g.set(x, y, z, "stone_bricks");
          } else {
            g.set(x, y, z, "glass_pane", paneProps);
          }
        } else if (z % 2 === 1) {
          // Glazed bay.
          g.set(x, y, z, "glass_pane", paneProps);
        } else {
          // Stone pilaster between bays.
          g.set(x, y, z, "stone_bricks");
        }
      } else if (off === 3) {
        // Stone lintel band under each floor slab.
        g.set(x, y, z, "stone_bricks");
      } else {
        // Red brick wall.
        g.set(x, y, z, "bricks");
      }
    } else {
      // Interior: air gap behind the glass, with warm lanterns on the floor slab.
      const lanternSpot = (x === 1 && z % 4 === 1) || (x === 2 && z % 4 === 3);
      if (off === 1 && k >= 1 && y - 1 >= gr && lanternSpot) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  // Roof deck on every cell at the lidar roof height.
  if (roof >= gr) g.set(x, roof, z, "smooth_stone");

  // Stone parapet on the perimeter, standing on the roof deck.
  if (P) g.set(x, roof + 1, z, "stone_brick_wall");

  // Small roof plant enclosure in the middle of the roof.
  if (!P && (x === 1 || x === 2) && z >= 5 && z <= 9) {
    g.set(x, roof + 1, z, "stone_bricks");
  }
}

// Entrance on the west face at z = 7: recessed double-height door in a stone surround.
if (entranceCell) {
  const ge = entranceCell[2];
  // Stone jambs either side of the door, and a lintel above.
  for (const dz of [-1, 1]) {
    const zz = entranceZ + dz;
    if (has(0, zz)) {
      for (let y = ge; y <= ge + 2; y++) g.set(0, y, zz, "stone_bricks");
    }
  }
  g.set(0, ge, entranceZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(0, ge + 1, entranceZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(0, ge + 2, entranceZ, "stone_bricks");
  // Lintel course over the door, sitting on the jambs.
  for (const dz of [-1, 0, 1]) {
    const zz = entranceZ + dz;
    if (has(0, zz)) g.set(0, ge + 3, zz, "stone_bricks");
  }
}

g.save(`${DIR}/DC87134.nbt`);
