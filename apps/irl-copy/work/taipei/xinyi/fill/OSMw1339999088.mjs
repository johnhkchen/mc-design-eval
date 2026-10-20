import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339999088";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 19, D = 9;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFp = (x, z) => G.has(`${x},${z}`);

const maxG = Math.max(...cells.map((c) => c[2]));
// Record: roof about 7 blocks above lowest ground. One commercial storey
// (about 5 blocks of wall) with a base course, shopfront, cornice and parapet.
const T = Math.max(7, maxG + 3); // roof cap sits at T-1, parapet at T-1
const minX = 0, maxX = 8, minZ = 0, maxZ = 8;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const perimeter = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

  // Floor slab at ground level for every cell.
  if (!perimeter) {
    g.set(x, gr, z, "smooth_stone");
  }

  if (perimeter) {
    const onZEdge = z === minZ || z === maxZ;
    const onXEdge = x === minX || x === maxX;
    // Index along the facade; corners are pillars.
    const along = onZEdge ? x : z;
    const isCorner = onZEdge && onXEdge;
    const isPillarIdx = along % 2 === 0 || isCorner;
    const onSouth = z === maxZ;
    const isDoor = onSouth && x === 4;

    // Base course.
    g.set(x, gr, z, "stone_bricks");

    // Shopfront on the first storey.
    if (isDoor) {
      g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isPillarIdx) {
      g.set(x, gr + 1, z, "light_gray_concrete");
    } else {
      g.set(x, gr + 1, z, "glass_pane");
    }

    // Upper window band with pillars between panes.
    for (let y = gr + 2; y <= T - 3; y++) {
      if (isDoor && y === gr + 2) continue; // door occupies this row
      if (isPillarIdx) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "glass_pane");
    }
    if (isDoor) {
      // Lintel above door
      g.set(x, gr + 3, z, "light_gray_concrete");
    }

    // Cornice and parapet.
    g.set(x, T - 2, z, "smooth_stone");
    g.set(x, T - 1, z, "light_gray_concrete");
  } else {
    // Interior: air gap, ceiling/roof cap at T-1.
    g.set(x, T - 1, z, "gray_concrete");
  }
}

// Warm hanging lanterns just inside the street-facing glass, on a few bays.
for (const [x, z, gr] of cells) {
  if (x < 1 || x > 7 || z < 1 || z > 7) continue;
  const edgeN = z === 1 && (x === 3 || x === 5);
  const edgeS = z === 7 && (x === 3 || x === 5);
  const edgeW = x === 1 && (z === 3 || z === 5);
  if (edgeN || edgeS || edgeW) {
    g.set(x, T - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof equipment: small plant block in the centre of the roof.
for (let x = 3; x <= 5; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!inFp(x, z)) continue;
    g.set(x, T, z, "light_gray_concrete");
    g.set(x, T + 1, z, "light_gray_concrete");
  }
}
g.set(4, T + 1, 4, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
