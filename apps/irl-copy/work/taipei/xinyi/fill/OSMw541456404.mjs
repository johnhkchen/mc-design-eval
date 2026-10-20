import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1980s Taipei commercial block: white tiled walls, quartz pilasters,
// tinted glass bays, shopfront ground storey, dark canopy over the entrance,
// stepped parapet, and a rooftop mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456404";
const W = 14, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const ROOF = L + 11;                              // roof cap layer (~11 above lowest ground)

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const ORDER = ["north", "south", "west", "east"];

const faceList = (x, z) => ORDER.filter((f) => !has(x + DIRS[f][0], z + DIRS[f][1]));
const isEdge = (x, z) => faceList(x, z).length > 0;
const isInterior = (x, z) => has(x, z) && !isEdge(x, z);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance on the north (low-z) face, centred along it.
const minZ = Math.min(...cells.map((c) => c[1]));
const northRow = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = northRow[Math.floor(northRow.length / 2)];
const doorGround = G(doorX, minZ);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const isDoorCell = x === doorX && z === minZ;
  const fs = faceList(x, z);
  const f = isDoorCell ? "north" : (fs[0] ?? null);
  const [dx, dz] = f ? DIRS[f] : [0, 0];
  const t = f === "north" || f === "south" ? x : z;
  const canopy = z === minZ && Math.abs(x - doorX) <= 1;

  for (let y = gr; y < ROOF; y++) {
    const rel = y - gr;

    if (!edge) {
      // Interior: open air between floor slabs (storey floors at rel 0 and 5).
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel === 0) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (rel <= 3 || (rel >= 6 && rel <= 8)) {
      // Window zones: ground shopfront (1-3) and upper bays (6-8).
      if (isDoorCell && (rel === 1 || rel === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoorCell && rel === 3) {
        put(x, y, z, "light_blue_stained_glass");         // transom over door
      } else if (t % 3 === 0) {
        put(x, y, z, "smooth_quartz");                    // pilaster between bays
      } else {
        put(x, y, z, "light_blue_stained_glass");         // tinted glazing
        // Warm light behind some glass: glowstone one cell inward in the air gap.
        const lit = (t + rel + x + z) % 4 === 0;
        if (lit && f) {
          const ix = x - dx, iz = z - dz;
          if (isInterior(ix, iz)) {
            put(ix, gr + (rel <= 3 ? 2 : 7), iz, (t + rel) % 8 === 0 ? "shroomlight" : "glowstone");
          }
        }
      }
    } else if (rel === 4) {
      put(x, y, z, canopy ? "gray_concrete" : "smooth_quartz"); // storey line / entrance canopy
    } else if (rel === 9) {
      put(x, y, z, "smooth_quartz");                      // cornice band
    } else {
      put(x, y, z, "white_concrete");                     // plain tiled wall
    }
  }

  // Roof cap: quartz parapet on the perimeter, grey slab over the interior.
  if (gr <= ROOF) put(x, ROOF, z, edge ? "smooth_quartz" : "light_gray_concrete");
}

// Rooftop mechanical penthouse over the middle of the roof.
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if (x >= 4 && x <= 9 && z >= 7 && z <= 14) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

// Two condenser units on the roof, away from the penthouse.
for (const [x, z] of [[2, 6], [2, 8], [11, 6]]) {
  if (isInterior(x, z)) put(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
