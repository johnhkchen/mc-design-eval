import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858020";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 21;
const ROOF = 10;      // roof deck top course (absolute y)
const PARAPET = 11;   // parapet course, building top = 12 blocks (~11 above lowest ground)
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(ROOF, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function outward(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push("north");
  if (!has(x, z + 1)) out.push("south");
  if (!has(x - 1, z)) out.push("west");
  if (!has(x + 1, z)) out.push("east");
  return out;
}

const GLASS = { north: "true", south: "true", east: "true", west: "true" };
const WALL = "white_concrete";
const TRIM = "smooth_stone";
const BASE = "stone_bricks";

for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const faces = outward(x, z);
  const edge = faces.length > 0;
  const corner = faces.length > 1;
  const f = faces[0];

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
  // Floor slab at this cell's ground level
  g.set(x, gr, z, edge ? BASE : TRIM);

  for (let y = gr + 1; y <= ROOF; y++) {
    const r = y - gr; // storey-relative row
    if (y === ROOF) { // roof deck, spans whole footprint
      g.set(x, y, z, TRIM);
      continue;
    }
    if (!edge) {
      // interior: air gap, with a floor slab per storey
      if (r === 5) g.set(x, y, z, TRIM);
      continue;
    }

    // Facade wall
    let b = WALL;
    if (r === 5) b = TRIM; // storey cornice / upper floor line

    const along = (f === "north" || f === "south") ? x : z;
    const lo = (f === "north" || f === "south") ? minX : minZ;
    const hi = (f === "north" || f === "south") ? maxX : maxZ;
    const off = along - lo;
    const isWin = !corner && off % 3 === 1 && along < hi;
    const isDoor = !corner && f === "south" && along === Math.round((lo + hi) / 2);

    if (isDoor && r >= 1 && r <= 4) {
      if (r === 1) g.set(x, y, z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (r === 2) g.set(x, y, z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (r === 3) g.set(x, y, z, "glass_pane", GLASS);
      else g.set(x, y, z, BASE); // lintel
      continue;
    }

    if (isWin && ((r >= 1 && r <= 3) || (r >= 6 && r <= 8))) {
      g.set(x, y, z, "glass_pane", GLASS);
      continue;
    }
    if (isWin && r === 4) { g.set(x, y, z, BASE); continue; } // ground-floor lintel
    if (isWin && r === 9) { g.set(x, y, z, TRIM); continue; } // upper sill / cap

    g.set(x, y, z, b);
  }

  // Parapet on the edge of the roof
  if (edge) g.set(x, PARAPET, z, TRIM);

  // Warm light behind some glass: in the air gap just inside the window
  if (edge && !corner) {
    const lo = (f === "north" || f === "south") ? minX : minZ;
    const along = (f === "north" || f === "south") ? x : z;
    const off = along - lo;
    const [dx, dz] = DIRS[f];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && outward(ix, iz).length === 0 && off % 3 === 1 && off % 2 === 0) {
      const igr = ground.get(key(ix, iz));
      const lightRows = [gr + 2, gr + 7];
      for (const y of lightRows) {
        if (y > igr && y < ROOF) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Roof equipment: a plant box on the interior roof, centred in the footprint
for (const [x, z] of cells) {
  if (outward(x, z).length > 0) continue;
  const gr = ground.get(key(x, z));
  if (x >= minX + 5 && x <= minX + 8 && z >= minZ + 6 && z <= minZ + 9 && gr < ROOF) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
