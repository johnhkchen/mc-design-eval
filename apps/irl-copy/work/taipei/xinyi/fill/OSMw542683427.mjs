import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683427.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542683427.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 23, D = 12;
const ROOF = 10;          // top course of the 2-storey block (roof about 11 blocks above lowest ground)
const SLAB = 5;           // ground floor / upper floor line
const BAND = 9;           // cornice band under the roof

// Era: 1980s-90s Xinyi commercial block. Beige tiled facade, stone base and bands,
// tinted glass in aluminium-style bays, dark timber entrance door, rooftop plant.
const FACADE = "smooth_sandstone";
const STONE = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const FLOOR = "smooth_stone";
const FOUND = "stone";
const ROOFDECK = "light_gray_concrete";

const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(g)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const g = new Voxels([W, H, D]);

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = ground.get(`${x},${z}`);

  // Solid foundation from y 0 up to this cell's ground so nothing floats on a slope.
  for (let y = 0; y < gg && y < H; y++) g.set(x, y, z, FOUND);

  const ex = Object.keys(DIRS).filter(d => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

  if (ex.length === 0) {
    // Interior: floor slabs and roof deck only, air gap behind the glass.
    if (gg <= ROOF) {
      g.set(x, gg, z, FLOOR);
      if (SLAB >= gg) g.set(x, SLAB, z, FLOOR);
      g.set(x, ROOF, z, ROOFDECK);
    }
    continue;
  }

  // Edge cell: facade wall from its own ground up to the roof.
  const corner = ex.length >= 2;
  const face = ex[0];
  const axisT = (face === "north" || face === "south") ? x : z;
  const isSouthFace = ex.includes("south") && !corner;
  const pier = corner || axisT % 3 === 0;
  const door = isSouthFace && axisT === 6;

  for (let y = gg; y <= ROOF && y < H; y++) {
    let b;
    if (y === gg) b = STONE;                              // plinth / base course
    else if (y === SLAB || y === BAND || y === ROOF) b = STONE; // storey lines and cornice
    else if (y < SLAB) {                                  // ground floor shopfront zone
      if (door && y <= gg + 2) continue;                  // doorway, set below
      b = pier ? FACADE : GLASS;
    } else if (y === 4 || y === 6) b = FACADE;            // lintel and sill
    else {                                                // second floor glazing (7, 8)
      if (pier) b = FACADE;
      else b = ((axisT + y) % 5 === 2) ? "glowstone" : GLASS;
    }
    g.set(x, y, z, b);
  }

  if (door && gg + 2 <= 3) {
    g.set(x, gg + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gg + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gg + 3 < SLAB) {
      g.set(x, gg + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Rooftop plant: a small grey plant block on the roof deck, inside the footprint.
for (let x = 3; x <= 5; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z)) continue;
    const ex = Object.keys(DIRS).filter(d => {
      const [dx, dz] = DIRS[d];
      return !has(x + dx, z + dz);
    });
    if (ex.length === 0 && ground.get(`${x},${z}`) <= ROOF) {
      g.set(x, ROOF + 1, z, "gray_concrete");
    }
  }
}

g.save(OUT);
