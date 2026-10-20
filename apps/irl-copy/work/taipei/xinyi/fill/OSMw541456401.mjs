import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district, c. 1990s:
// white tiled walls, pale stone base, light-blue glazed shopfront,
// glazed upper floor with white piers, concrete cornice, central entrance
// canopy with lantern, and rooftop water tank and HVAC plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456401";
const W = 21, H = 23, D = 21;
const ROOF = 11;     // roof surface, absolute y (about 11 blocks above lowest ground)
const BAND = 5;      // floor-2 storey line
const PARA = 10;     // parapet course
const MAX_GROUND = 4; // keep the ground floor above the foundation band

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr] of raw) {
  cells.set(`${x},${z}`, Math.max(0, Math.min(MAX_GROUND, Math.round(gr))));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const has = (x, z) => cells.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Facade face for a perimeter cell: N (z-1 open), S (z+1 open), W, E.
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
};

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const isPerim = perim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isPerim) {
    const face = faceOf(x, z);
    const t = face === "N" || face === "S" ? x : z;
    const pier = t % 3 === 0 || t === 0 || t === W - 1;
    const entranceCol = face === "S" && t >= 9 && t <= 11;

    for (let y = gr; y <= PARA; y++) {
      let id = null, props = undefined;
      if (y === gr) {
        id = "stone_bricks";                                  // base course
      } else if (y <= 4) {                                    // ground-floor shopfront
        if (entranceCol && y <= 3) {
          id = null;                                          // entrance opening
        } else if (entranceCol && y === 4) {
          id = "white_concrete";                              // entrance lintel
        } else if (pier) {
          id = "white_concrete";
        } else {
          id = "light_blue_stained_glass";
        }
      } else if (y === BAND) {
        id = "light_gray_concrete";                           // storey line
      } else if (y <= 8) {                                    // upper floor glazing
        id = pier ? "white_concrete" : "light_blue_stained_glass";
      } else if (y === 9) {
        id = "white_concrete";                                // spandrel
      } else {
        id = "light_gray_concrete";                           // parapet
      }
      if (id) put(x, y, z, id);
    }

    // Cornice cap over the parapet, flush with the roof.
    put(x, ROOF, z, "light_gray_concrete");

    // Entrance lantern hanging in the opening, centre column.
    if (entranceCol && t === 10) {
      put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Interior: ground-floor slab, floor-2 slab, and occasional warm light
    // placed behind the glazing in the upper storey.
    put(x, gr, z, "smooth_stone");
    put(x, BAND, z, "smooth_quartz");
    if ((x + z) % 8 === 0) put(x, 7, z, "shroomlight");
  }

  // Roof membrane on every footprint cell.
  put(x, ROOF, z, isPerim ? "light_gray_concrete" : "gray_concrete");
}

// Rooftop water tank (cylindrical-style ring on a small plinth) and HVAC plant.
for (let x = 4; x <= 7; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!has(x, z)) continue;
    const ring = x === 4 || x === 7 || z === 4 || z === 7;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (ring) put(x, y, z, "white_concrete");
    }
    put(x, ROOF + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 13; x <= 15; x++) {
  for (let z = 13; z <= 15; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
