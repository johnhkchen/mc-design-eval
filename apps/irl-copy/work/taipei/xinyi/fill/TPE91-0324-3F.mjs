import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0324-3F";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 7 footprint, roof about 16 blocks above the lowest ground.
// Storeys are 5 blocks, measured from each cell's own ground so the roof stays level.
const W = 11, H = 28, D = 7;
const ROOF = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

// Exposed faces of a footprint cell (which sides face outside the footprint)
function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Inward neighbour through a given face
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const lamps = [];

// Pass 1: foundation, floors, storeys and facade
for (const [x, z, gr] of cells) {
  // Foundation solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Ground floor slab
  g.set(x, gr, z, "stone_bricks");

  const faces = exposed(x, z);

  for (let y = gr + 1; y <= ROOF; y++) {
    const rel = y - gr;
    const storey = Math.floor(rel / 5);
    const r5 = rel % 5;

    if (y === ROOF) {
      // Parapet on the exterior only
      if (faces.length > 0) g.set(x, y, z, "white_concrete");
      continue;
    }

    if (faces.length === 0) {
      // Interior: only floor slabs at storey lines, air otherwise
      if (rel > 0 && r5 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (faces.length >= 2) {
      // Corner pillar
      g.set(x, y, z, r5 === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    const face = faces[0];
    const idx = (face === "N" || face === "S") ? x : z;

    if (storey === 0) {
      // Ground floor: shopfront
      if (rel === 4) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (rel >= 1 && rel <= 3) {
        // Door on the south face at the centre bay
        if (face === "S" && x === 5 && rel === 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (face === "S" && x === 5 && rel === 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (face === "S" && x === 5 && rel === 3) {
          g.set(x, y, z, "light_gray_concrete");
        } else if (idx % 2 === 1) {
          g.set(x, y, z, "light_blue_stained_glass");
        } else {
          g.set(x, y, z, "white_concrete");
        }
      }
      continue;
    }

    // Upper storeys
    if (r5 === 0) {
      g.set(x, y, z, "light_gray_concrete");       // storey line
    } else if (r5 === 4) {
      g.set(x, y, z, "white_concrete");            // spandrel
    } else {
      if (idx % 2 === 1) {
        g.set(x, y, z, "light_blue_stained_glass"); // window bay
        // Warm light behind some windows
        if (idx % 4 === 1 && storey % 2 === 0 && r5 === 2) {
          const [dx, dz] = inward[face];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && exposed(ix, iz).length === 0) {
            lamps.push([ix, y, iz, (storey + idx) % 2 === 0 ? "glowstone" : "shroomlight"]);
          }
        }
      } else {
        g.set(x, y, z, "white_concrete");           // wall pier
      }
    }
  }
}

// Pass 2: lamps behind glass (interior cells only)
for (const [x, y, z, id] of lamps) g.set(x, y, z, id);

// Pass 3: roof slab (cornice course) at ROOF-1 across the whole footprint
for (const [x, z, gr] of cells) {
  if (gr < ROOF - 1) g.set(x, ROOF - 1, z, "smooth_stone");
}

// Roof equipment: AC plant boxes and a lightning rod on the roof
for (const [x, z] of [[3, 3], [7, 3]]) {
  if (has(x, z) && exposed(x, z).length === 0) {
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "iron_block");
  }
}
if (has(5, 3) && exposed(5, 3).length === 0) {
  for (let y = ROOF; y <= ROOF + 2; y++) {
    g.set(5, y, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
