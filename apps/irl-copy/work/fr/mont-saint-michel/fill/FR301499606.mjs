import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${dir}/FR301499606.cells.json`, "utf8"));

const W = 7, D = 9, H = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { gr, rf });

// Flat, smoothed roof level from the median lidar roof height
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...cells.map(c => c[2]));
let capY = Math.round(medianRoof);
capY = Math.max(capY, maxGround + 4);
capY = Math.min(capY, H - 1);

const dirs = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];

const DOOR_X = 3;
const DOOR_Z = D - 1;

const isInteriorCell = (x, z) =>
  ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !cellMap.has(key(x + dx, z + dz)));

for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const outward = dirs.filter(d => !cellMap.has(key(x + d.dx, z + d.dz)));
  const isEdge = outward.length > 0;
  const isCorner = outward.length > 1;

  // Ground floor surface
  g.set(x, gr, z, "smooth_stone");

  // Ceiling course under the roof cap
  g.set(x, capY - 1, z, "stone_bricks");

  // Roof cap: cornice on edges, dark slate inside
  if (isEdge) g.set(x, capY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, capY, z, "deepslate_tiles");

  if (!isEdge) {
    if (gr + 3 < capY - 1) g.set(x, gr + 3, z, "smooth_stone");
    continue;
  }

  // Edge walls
  for (let y = gr; y < capY - 1; y++) g.set(x, y, z, "stone_bricks");

  // Quoins: corner stones of chiseled stone bricks, alternating up the height
  if (isCorner) {
    for (let y = gr; y < capY - 1; y++) {
      if ((y - gr) % 2 === 0) g.set(x, y, z, "chiseled_stone_bricks");
    }
  }

  // Storey belt course
  if (gr + 3 < capY - 1) {
    g.set(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Base course at ground level on the walls
  g.set(x, gr, z, "polished_andesite");

  // Windows on non-corner faces, alternating with stone piers
  if (!isCorner && outward.length === 1) {
    const face = outward[0];
    const along = face.dx !== 0 ? z : x;
    const isDoorCell = face.name === "south" && x === DOOR_X;
    if (along % 2 === 1 && !isDoorCell) {
      const rows = [gr + 1, gr + 2];
      if (gr + 4 < capY - 1) rows.push(gr + 4);
      for (const y of rows) g.set(x, y, z, "glass_pane", { waterlogged: "false" });
      // Stone lintel above the top pane row of each window
      const top = rows[rows.length - 1];
      if (top + 1 < capY - 1 && top + 1 !== gr + 3) {
        g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// Entrance door, south face, centre
{
  const cell = cellMap.get(key(DOOR_X, DOOR_Z));
  if (cell) {
    const gr = cell.gr;
    g.set(DOOR_X, gr + 1, DOOR_Z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(DOOR_X, gr + 2, DOOR_Z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Canopy band above the door, lit by a lantern hung from it
    if (gr + 3 < capY - 1) {
      g.set(DOOR_X, gr + 3, DOOR_Z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
    // Interior lantern just inside the door, so the entrance glows at dusk
    if (cellMap.has(key(DOOR_X, DOOR_Z - 1))) {
      const inner = cellMap.get(key(DOOR_X, DOOR_Z - 1));
      g.set(DOOR_X, inner.gr + 1, DOOR_Z - 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Warm interior lights behind selected windows
for (const [x, z, gr] of cells) {
  if (isInteriorCell(x, z) && (x + z) % 4 === 1) {
    g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (isInteriorCell(x, z) && gr + 4 < capY - 1 && (x + z) % 4 === 3) {
    g.set(x, gr + 4, z, "shroomlight");
  }
}

g.save(`${dir}/FR301499606.nbt`);
