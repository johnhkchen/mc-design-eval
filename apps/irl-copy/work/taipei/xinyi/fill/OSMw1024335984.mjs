import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024335984";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 17, roof about 11 blocks above lowest ground.
// Reads as a mid-century concrete-frame commercial block: white concrete frame,
// glazed bays, stone plinth, light spandrels, parapet cornice, rooftop water tank.
const W = 20, H = 23, D = 17;
const ROOF = 10;      // roof deck layer
const PARAPET = 11;   // parapet / cornice layer (roof ~11 above lowest ground)

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

function outward(x, z) {
  for (const d of DIRS) if (!has(x + d.dx, z + d.dz)) return d;
  return null;
}

// Door position: median x of the south-facing edge cells on the front (south) facade.
const southIdx = cells
  .filter(([x, z]) => { const o = outward(x, z); return o && o.name === "south"; })
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southIdx.length ? southIdx[Math.floor(southIdx.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const base = Math.max(0, Math.min(gr, ROOF - 1));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone");

  const out = outward(x, z);
  const idx = out && (out.name === "north" || out.name === "south") ? x : z;

  for (let y = base; y < ROOF; y++) {
    const rel = y - base;
    const k = Math.floor(rel / 5);   // storey index
    const r = rel % 5;               // row within storey

    // Floor slab at the base of every storey (all cells, forms the floor plate).
    if (r === 0) {
      g.set(x, y, z, "white_concrete");
    }

    if (!out) {
      // Interior: air gap, floor slabs only.
      continue;
    }

    // Plinth course at the base of the building on edge cells.
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (r === 0) continue; // slab already set

    if (r === 4) {
      // Spandrel band between storeys.
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Rows 1..3: glazing with white concrete piers every third bay.
    const isPier = idx % 3 === 0;

    if (k === 0) {
      // Ground floor shopfront.
      const isDoor = out.name === "south" && x === doorX && (r === 1 || r === 2);
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: out.name,
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isPier) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
    } else {
      // Upper storeys: glazed bays, occasional warm shroomlight behind glass.
      if (isPier) {
        g.set(x, y, z, "white_concrete");
      } else if (r === 2 && (x * 7 + z * 3 + k) % 4 === 0) {
        g.set(x, y, z, "shroomlight");
      } else {
        g.set(x, y, z, "glass");
      }
    }
  }

  // Roof deck.
  g.set(x, ROOF, z, out ? "white_concrete" : "smooth_stone");

  // Parapet and cornice on the perimeter.
  if (out) {
    g.set(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop water tank: 3 x 3 drum on the interior, if the footprint allows.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++) {
    const gr = ground.get(`${cx + dx},${cz + dz}`);
    if (gr === undefined || gr > ROOF - 1 || outward(cx + dx, cz + dz)) tankOk = false;
  }
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      g.set(cx + dx, PARAPET, cz + dz, "dark_oak_planks");
      g.set(cx + dx, PARAPET + 1, cz + dz, "dark_oak_planks");
    }
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      g.set(cx + dx, PARAPET + 2, cz + dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Small AC plant on the roof, if the cell is clear.
for (const [x, z, gr] of cells) {
  if (x === 3 && z === 3 && gr <= ROOF - 1 && !outward(x, z)) {
    g.set(x, PARAPET, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
