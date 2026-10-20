import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703667";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 13 x 24, two storeys of 5 blocks, flat roof with parapet.
const W = 13, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(key(x, z), gr);
const has = (x, z) => occ.has(key(x, z));
const groundOf = (x, z) => occ.get(key(x, z));

// Edge cell: at least one 4-neighbour is outside the footprint.
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front face = the cells with no footprint neighbour toward -z.
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => [x, z])
  .sort((a, b) => a[0] - b[0]);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = "glass_pane";
const MULLION = "white_concrete";
const WALL_SPANDREL = "light_gray_concrete";
const FASCIA = "smooth_quartz";
const FLOOR = "smooth_stone";
const BASE = "stone_bricks";
const ROOF = "gray_concrete";
const CORNICE = "quartz_block";
const PARAPET_CAP = "smooth_quartz_slab";

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Ground-level base course on the perimeter, floor slab otherwise.
  put(x, gr, z, edge ? BASE : FLOOR);

  // Storey floor slabs: ground storey base (gr) and second storey (gr+5).
  if (!edge) put(x, gr + 5, z, FLOOR);
  else put(x, gr + 5, z, FLOOR);

  // Roof deck at gr+10: cornice band on the edge, gravel-grey roof inside.
  put(x, gr + 10, z, edge ? CORNICE : ROOF);

  if (edge) {
    // Parapet cap on the perimeter.
    put(x, gr + 11, z, PARAPET_CAP, { type: "bottom", waterlogged: "false" });

    // Storey walls.
    for (const b of [gr, gr + 5]) {
      const ground = b === gr;
      for (let dy = 1; dy <= 4; dy++) {
        const y = b + dy;
        if (dy === 4) {
          // Fascia / spandrel line at the top of each storey.
          put(x, y, z, ground ? FASCIA : WALL_SPANDREL);
          continue;
        }
        if (ground) {
          // Shopfront: glass with concrete mullions.
          put(x, y, z, (x + z) % 4 === 0 ? MULLION : PANE);
        } else {
          // Upper storeys: window grid with frames.
          put(x, y, z, (x + z) % 3 === 0 ? MULLION : PANE);
        }
      }
    }
  }
}

// Entrance on the front face: double-height door with a hanging lantern above.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gr = groundOf(dx, dz);
  put(dx, gr + 1, dz, "dark_oak_door", {
    half: "lower", facing: "north", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 2, dz, "dark_oak_door", {
    half: "upper", facing: "north", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light behind some upper-storey windows (interior gap cells).
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if ((x * 3 + z) % 7 !== 0) continue;
  put(x, gr + 5 + 2, z, "glowstone");
}

// Roof equipment: a small plant box in the interior of the roof, if the footprint allows.
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x >= 4 && x <= 6 && z >= 16 && z <= 18) {
    put(x, gr + 11, z, WALL_SPANDREL);
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

// Lights on the roof corners above the parapet, for dusk reading.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  if ((x === 0 || x === W - 1) && (z === 0 || z === D - 1)) {
    put(x, gr + 11, z, "sea_lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
