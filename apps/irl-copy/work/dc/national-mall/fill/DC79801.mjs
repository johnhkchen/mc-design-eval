// DC79801: a 7 x 9 limestone office block on the Mall's flank (early-20th-century Beaux-Arts commercial).
// Three storeys on a 6-block body, a 7-block shoulder and an 8-block tower at the NW corner (the lidar's 8 and 7 tiers).
// Lidar's 5s are noise on a flat body, so they are smoothed up to the 6 tier.
// Walls are a 1-cell shell (glass set in it, air behind), floor slabs per storey, a roof deck, no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79801.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79801.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 7, D = 9, TOP = 20;

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(key(x, z), { ground, h: Math.max(roof, 6) });

const hAt = (x, z) => foot.get(key(x, z))?.h ?? -1;      // -1 outside the footprint: every side there is exposed
const ground = (x, z) => foot.get(key(x, z)).ground;

// outward normals (dx, dz) and the face's name
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];

const M = {
  wall: "calcite",              // limestone piers and blank bays
  plinth: "stone_bricks",       // base course at y 0
  belt: "smooth_stone",         // sill and floor-line belts
  cornice: "stone_bricks",      // top course
  floor: "stone",               // interior slabs and roof deck
  mech: "smooth_stone",         // roof box on the tower
};

const v = new Voxels([W, TOP, D]);

// the one entrance: south face, centre bay of the body
const DOOR = [3, 8];

for (const [x, z] of Array.from(foot.keys(), (k) => k.split(",").map(Number))) {
  const { h } = foot.get(key(x, z));
  // fill the lowest-ground foundation first (all cells sit on y 0 here, so this is a no-op kept for slopes)
  for (let y = 0; y < ground(x, z); y++) v.set(x, y, z, M.plinth);

  for (let y = ground(x, z); y < h; y++) {
    // which neighbours are open to the air at this height: outside the footprint, or below this level's roof
    const open = SIDES.filter(([dx, dz]) => hAt(x + dx, z + dz) <= y);

    if (open.length === 0) {
      // interior: slabs at storey floors and the roof deck, air between (windows back onto air)
      const slab = y === 0 || y === 2 || y === 4 || y === 5 || y === 6 || y === h - 1;
      if (slab) v.set(x, y, z, M.floor);
      continue;
    }

    // a shell cell: pick the face it shows (N, S, W, E order) and its position along that face
    const [dx, dz] = open[0];
    const along = dz !== 0 ? x : z;
    const role = y === 0 ? "plinth" : y === h - 1 ? "cornice" : y % 2 === 0 ? "belt" : "glass";
    const isDoor = dz === 1 && x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2);

    if (isDoor) {
      const half = y === 1 ? "lower" : "upper";
      v.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (role === "glass" && along % 2 === 1) {
      // a glass pane in the bay, joined to its neighbouring piers on the face
      const across = dz !== 0 ? "east" : "north";
      const other = dz !== 0 ? "west" : "south";
      v.set(x, y, z, "glass_pane", {
        [across]: "true", [other]: "true",
        ...(dz !== 0 ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" }),
        waterlogged: "false",
      });
      // a warm light in the room behind some panes (the cell inside the wall, air on a window row)
      const ix = x - dx, iz = z - dz;
      if (hAt(ix, iz) > y && open.length === 1 && (x + y + z) % 3 === 0 && y % 2 === 1) {
        v.set(ix, y, iz, "glowstone");
      }
      continue;
    }
    if (role === "glass") { v.set(x, y, z, M.wall); continue; }    // piers
    v.set(x, y, z, M[role] ?? M.wall);
  }
}

// the lintel course over the entrance, and a roof box with a lightning rod on the tower
for (const x of [2, 4]) v.set(x, 3, 8, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
v.set(2, 8, 2, M.mech);
v.set(3, 8, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

v.save(OUT);
console.log("saved", OUT, "blocks", v.count(), "palette", v.palette.length);
