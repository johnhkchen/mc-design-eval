import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey late-20th-century concrete commercial block: stone-clad shopfront
// base, white-concrete piers with glazed bays, light-grey spandrels, a
// smooth-stone cornice, a stone parapet, and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690429";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const DIRS = {
  N: [0, -1], // -z
  S: [0, 1],  // +z
  W: [-1, 0], // -x
  E: [1, 0],  // +x
};

// Perimeter = footprint cell with at least one open side.
const exposed = (x, z) => {
  const out = {};
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    out[k] = !has(x + dx, z + dz);
  }
  return out;
};
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.E || e.W;
};

// Materials
const FOUND = "stone_bricks";
const PIER = "white_concrete";
const SPAND = "light_gray_concrete";
const BASE = "stone_bricks";
const STRING = "smooth_stone";
const CORNICE = "smooth_stone";
const PARAPET = "stone_bricks";
const ROOFDECK = "gray_concrete";
const FLOOR = "light_gray_concrete";
const GLASS = "glass_pane";

// Entrance: middle of the south-facing exposed run (fallback: any exposed cell).
const southCells = cells
  .filter(([x, z]) => exposed(x, z).S)
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
let entranceX = null, entranceZ = null;
if (southCells.length) {
  entranceX = southCells[Math.floor(southCells.length / 2)];
  entranceZ = cells.find(([x, z]) => x === entranceX && exposed(x, z).S)[1];
}

const W = 19, H = 23, D = 23;
const g = new Voxels([W, H, D]);

for (const [x, z, rawGround] of cells) {
  const ground = Math.min(Math.max(rawGround, 0), 9);
  const e = exposed(x, z);
  const perim = e.N || e.S || e.E || e.W;

  // Foundation under every cell, so nothing floats on the slope.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  if (!perim) {
    // Interior: air, with floor slabs and a roof deck. No interior walls.
    if (ground <= 5) g.set(x, 5, z, FLOOR);
    g.set(x, 10, z, ROOFDECK);

    // Rooftop plant on the roof deck.
    if (x % 5 === 2 && z % 4 === 2) g.set(x, 11, z, "iron_block");
    continue;
  }

  // Facade classification.
  const corner = (e.N || e.S) && (e.E || e.W);
  // Facade running along x (exposed N/S) vs along z (exposed E/W).
  const alongX = (e.N || e.S) && !(e.E || e.W);
  const alongZ = (e.E || e.W) && !(e.N || e.S);
  const along = alongX ? x : alongZ ? z : x + z;
  const pier = corner || along % 3 === 0;
  const isEntrance = x === entranceX && z === entranceZ;

  const glassProps = alongX
    ? { east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", waterlogged: "false" };

  for (let y = ground; y <= 11; y++) {
    if (y <= 3) {
      // Shopfront: stone piers, glazing between, open entrance.
      if (pier) g.set(x, y, z, BASE);
      else if (isEntrance) { /* open doorway */ }
      else g.set(x, y, z, GLASS, glassProps);
    } else if (y === 4) {
      // Ground-floor lintel.
      g.set(x, y, z, BASE);
    } else if (y === 5) {
      // String course between storeys.
      g.set(x, y, z, STRING);
    } else if (y >= 6 && y <= 9) {
      if (pier) g.set(x, y, z, PIER);
      else if (y === 6) g.set(x, y, z, STRING); // sill
      else if (y === 9) g.set(x, y, z, SPAND);  // spandrel
      else g.set(x, y, z, GLASS, glassProps);   // upper glazing
    } else if (y === 10) {
      g.set(x, y, z, CORNICE);
    } else if (y === 11) {
      g.set(x, y, z, PARAPET);
    }
  }

  // Roof deck meets the wall top on perimeter too.
  // (The cornice at y=10 and parapet at y=11 stand on the wall.)

  // Warm light behind some upper-storey glazing, on the interior floor.
  if (!pier && ground <= 5 && along % 6 === 1) {
    let ix = x, iz = z;
    if (e.N) iz = z + 1;
    else if (e.S) iz = z - 1;
    else if (e.W) ix = x + 1;
    else if (e.E) ix = x - 1;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      g.set(ix, 6, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
