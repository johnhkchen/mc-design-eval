import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// American Security and Trust Company, 1501 Pennsylvania Ave NW.
// Read as a 1920s Beaux-Arts bank: pale stone (calcite) walls on a stone
// base, a 3-block storey rhythm, pilastered bays, a banking hall with tall
// glazing on the ground floor, a central iron-door entrance on the street
// (z-min) face under a chiseled lintel with a warm light, a solid calcite
// parapet and a flat roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87202.cells.json`, "utf8"));

const W = 9, H = 22, D = 18;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  cm.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => cm.has(`${x},${z}`);

const SLAB = (type = "bottom") => ({ type, waterlogged: "false" });
const lit = [];

for (const [key, { gr, rf }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const top = rf;                       // roof level above y 0
  const capK = top - 1 - gr;            // k index of the top floor cap

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  const onZFace = !has(x, z - 1) || !has(x, z + 1);
  const idx = onZFace ? x : z;          // position along the facade
  const isCorner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const isFront = !has(x, z - 1);       // street face (z minimum)

  // Outward and inward directions for perimeter cells.
  let ox = 0, oz = 0;
  if (perim) {
    if (!has(x, z - 1)) oz = -1;
    else if (!has(x, z + 1)) oz = 1;
    else if (!has(x - 1, z)) ox = -1;
    else if (!has(x + 1, z)) ox = 1;
  }

  for (let y = gr; y < top; y++) {
    const k = y - gr;
    const floorLine = k % 3 === 0;

    if (!perim) {
      // Interior: no rooms, just floor slabs and air.
      if (floorLine || k === capK) g.set(x, y, z, "smooth_stone_slab", SLAB("bottom"));
      continue;
    }

    if (isCorner) {
      g.set(x, y, z, "calcite");
      continue;
    }

    // Storey lines and cornice band: stone courses.
    if (floorLine || k === capK) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Street-front entrance: pilasters, iron door, chiseled lintel over.
    const entranceZone = isFront && idx >= 3 && idx <= 5 && k <= 2;
    if (entranceZone) {
      if (idx === 4) {
        if (k === 1) g.set(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, "calcite");
      }
      continue;
    }
    if (isFront && idx >= 3 && idx <= 5 && k === 3) {
      // Lintel over the entrance, with a warm light at its centre.
      g.set(x, y, z, idx === 4 ? "glowstone" : "chiseled_stone_bricks");
      continue;
    }

    if (idx % 2 === 0) {
      g.set(x, y, z, "calcite");        // piers between bays
    } else {
      // Window bay: sill course below each row of glass.
      if (k % 3 === 1) {
        g.set(x, y, z, "smooth_stone_slab", SLAB("top"));
        continue;
      }
      g.set(x, y, z, "glass_pane");
      if (k % 3 === 2) {
        const inx = x - ox, inz = z - oz;
        if (has(inx, inz) && (((idx * 3) + k * 5 + z) % 4 === 0)) {
          lit.push([inx, y, inz]);
        }
      }
    }
  }

  // Solid calcite parapet one block above the cornice band.
  if (perim && top < H) {
    g.set(x, top, z, "calcite");
  }
}

// Glowstone behind lit windows, inside the air gap (interior cells only).
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");

g.save(`${DIR}/DC87202.nbt`);
