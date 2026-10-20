import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834862";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 92, H = 66, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Record: ~10 storeys of 5 blocks, parapet to 54 blocks total.
// Storey lines at y = 0,5,...,50 (absolute). Roof deck y=50, parapet 51..53.
const ROOF_DECK = 50;
const PARAPET_TOP = 53;

const WIN = "light_blue_stained_glass";  // tinted curtain-wall glass
const MULL = "white_concrete";           // mullions and storey lines
const SPAN = "light_gray_concrete";      // spandrels
const FLOOR = "light_gray_concrete";     // interior slabs
const FOUND = "stone_bricks";            // foundation / podium base

const glowAt = []; // deferred warm lights behind glass
const doorAt = []; // deferred entrances

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const G = Math.max(0, Math.min(Math.floor(gr), ROOF_DECK - 1));

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);

  // Envelope test: a cell with a missing neighbour across z or x is on the outside.
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const env = edgeZ || edgeX;
  // Along-facade coordinate: x on the long faces, z on the ends.
  const s = edgeZ ? x : z;

  // Storey bands from the ground up to the deck
  for (let y = G; y < ROOF_DECK; y++) {
    const r = y % 5;
    if (env) {
      let b;
      if (r === 0) b = MULL;                 // storey line / slab edge
      else if (r === 4) b = SPAN;            // spandrel below next storey line
      else b = (s % 3 === 0) ? MULL : WIN;   // window zone with mullions
      g.set(x, y, z, b);
    } else {
      if (r === 0) g.set(x, y, z, FLOOR);    // floor slab, air gap elsewhere
    }
  }

  // Roof deck at y=50
  if (env) g.set(x, ROOF_DECK, z, MULL);
  else g.set(x, ROOF_DECK, z, FLOOR);

  // Parapet and cap on the perimeter
  if (env) {
    g.set(x, 51, z, MULL);
    g.set(x, 52, z, MULL);
    g.set(x, PARAPET_TOP, z, "smooth_stone_slab");
    // Cap slab top-half so the parapet reads as a cornice
    g.set(x, PARAPET_TOP, z, "smooth_stone_slab", { type: "top" });
  } else {
    // Rooftop plant boxes and a cooling-tower block on the interior
    if (x % 10 >= 3 && x % 10 <= 4 && z >= 5 && z <= 12) {
      g.set(x, 51, z, "gray_concrete");
      g.set(x, 52, z, "gray_concrete");
    } else if (x % 17 === 8 && z >= 2 && z <= 3) {
      g.set(x, 51, z, "light_gray_concrete");
      g.set(x, 52, z, "light_gray_concrete");
    }
  }

  // Warm lights behind some windows (interior side of the envelope)
  if (env) {
    const dz = edgeZ ? (z === 0 ? 1 : (z === D - 1 ? -1 : 0)) : 0;
    const dx = edgeX && !edgeZ ? (x === 0 ? 1 : (x === W - 1 ? -1 : 0)) : 0;
    for (let y = G; y < ROOF_DECK; y++) {
      const r = y % 5;
      if (r !== 2) continue;
      const band = Math.floor(y / 5);
      if ((s + band * 2) % 5 === 1 && (dz !== 0 || dx !== 0) && has(x + dx, z + dz)) {
        glowAt.push([x + dx, y, z + dz, (band % 2 === 0) ? "glowstone" : "shroomlight"]);
      }
    }
  }

  // Entrance on the north face (z=0), central ground-floor doors
  if (z === 0 && x >= 40 && x <= 43 && G <= 4) {
    doorAt.push([x, G, z]);
  }
}

// Warm lights behind glass
for (const [x, y, z, b] of glowAt) g.set(x, y, z, b);

// Entrances: a plinth course under each door, then a two-block iron door
for (const [x, G, z] of doorAt) {
  if (x !== 41 && x !== 42) continue;
  g.set(x, G, z, FOUND);
  g.set(x, G + 1, z, "iron_door", {
    facing: "north", half: "lower", hinge: x === 41 ? "left" : "right", open: "false", powered: "false",
  });
  g.set(x, G + 2, z, "iron_door", {
    facing: "north", half: "upper", hinge: x === 41 ? "left" : "right", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
