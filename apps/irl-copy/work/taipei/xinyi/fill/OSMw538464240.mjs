import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s: two storeys over a stone plinth,
// white piers, glass bays, a shopfront with a central door on the south (street) face,
// stone cornice and a white parapet. Roof surface at y 11, parapet to y 12.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464240.cells.json", "utf8"));

const W = 20, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];

// Which cells are exposed, and the front (south) door column.
const southTs = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x, z]) => x);
const mid = southTs.length
  ? Math.floor((Math.min(...southTs) + Math.max(...southTs)) / 2)
  : -1;

const paneProps = (facing) =>
  facing === "north" || facing === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const isEdge = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// 1. Foundation, floor slabs, roof surface, interior glow
for (const [x, z, gr] of cells) {
  // foundation fill below the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // floor of the ground storey
  g.set(x, gr, z, "stone_bricks");
  // storey floor slab at y 5 (interior and perimeter)
  if (5 > gr) g.set(x, 5, z, "white_concrete");
  // roof surface over every cell
  g.set(x, 11, z, "smooth_stone");
  // rooftop plant block near the middle
  if (x >= 6 && x <= 13 && z >= 5 && z <= 10) {
    g.set(x, 12, z, "gray_concrete");
    g.set(x, 13, z, "gray_concrete");
  }
}

// 2. Perimeter walls, windows, shopfront, cornice, parapet
for (const [x, z, gr] of cells) {
  for (const { dx, dz, facing } of DIRS) {
    if (has(x + dx, z + dz)) continue;
    const t = dx !== 0 ? z : x;
    const pp = paneProps(facing);
    const isFront = facing === "south";

    for (let y = gr; y <= 10; y++) {
      if (y === gr) {
        g.set(x, y, z, "stone_bricks"); // plinth
      } else if (y <= 4) {
        if (isFront && t === mid) {
          if (y === 1) {
            g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          } else if (y === 2) {
            g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          } else if (y === 3) {
            g.set(x, y, z, "glass_pane", pp); // transom
          } else {
            g.set(x, y, z, "gray_concrete"); // dark fascia over the entrance
          }
        } else if (t % 3 === 0) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "glass_pane", pp);
        }
      } else if (y === 5) {
        g.set(x, y, z, "smooth_quartz"); // storey band
      } else if (y <= 9) {
        if (t % 3 === 0) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "glass_pane", pp);
      } else if (y === 10) {
        g.set(x, y, z, "stone_bricks"); // cornice
      }
    }

    // parapet
    g.set(x, 12, z, "white_concrete");

    // warm light behind some upper-floor windows (inside the first interior cell)
    if (t % 6 === 2) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isEdge(ix, iz)) {
        g.set(ix, 7, iz, "glowstone");
      }
    }
    // a lamp behind the shopfront glass
    if (isFront && t % 6 === 4 && t !== mid) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isEdge(ix, iz)) {
        g.set(ix, 2, iz, "shroomlight");
      }
    }
  }
}

// Entrance lantern above the door, on the front face of the storey band
for (const [x, z] of cells) {
  if (!has(x, z + 1) && x === mid) {
    g.set(x, 5, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464240.nbt");
