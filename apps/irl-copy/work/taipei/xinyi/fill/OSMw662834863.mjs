import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834863";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 47, D = 28;
const g = new Voxels([W, H, D]);

const ROOF = 35;          // roof slab level (about 35 above lowest ground)
const STOREY = 5;         // block height per storey
const FOUND = "stone";
const BASE = "stone_bricks";
const BAND = "smooth_quartz";
const GLASS = "cyan_stained_glass";
const MULLION = "white_concrete";
const SLAB = "light_gray_concrete";
const WALL = "white_concrete";
const GLOW = "glowstone";

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Facade / structure pass over each footprint cell
for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, FOUND);

  const nW = has(x - 1, z), nE = has(x + 1, z);
  const nN = has(x, z - 1), nS = has(x, z + 1);
  const edge = !(nW && nE && nN && nS);

  // interior neighbour used for warm light behind glass
  let inward = null;
  if (nW) inward = [x - 1, z];
  else if (nE) inward = [x + 1, z];
  else if (nN) inward = [x, z - 1];
  else if (nS) inward = [x, z + 1];

  for (let y = gy; y < ROOF; y++) {
    if (!edge) {
      // interior: floor slabs only, air elsewhere (no interiors)
      if (y > gy && y % STOREY === 0) g.set(x, y, z, SLAB);
      continue;
    }
    if (y === gy) { g.set(x, y, z, BASE); continue; }
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;
    const mullion = (x + z) % 3 === 0;
    if (s === 0) {
      // shopfront storey
      if (r === 0) g.set(x, y, z, BASE);
      else if (r === 4) g.set(x, y, z, BAND);
      else g.set(x, y, z, mullion ? MULLION : GLASS);
    } else {
      if (r === 0 || r === 4) g.set(x, y, z, BAND);
      else if (mullion) g.set(x, y, z, MULLION);
      else {
        g.set(x, y, z, GLASS);
        // warm light behind some windows, in the air gap
        if (r === 2 && inward && ((x * 7 + z * 3 + s) % 4 === 0)) {
          g.set(inward[0], y, inward[1], GLOW);
        }
      }
    }
  }

  // roof level
  if (edge) {
    g.set(x, ROOF, z, BAND);            // cornice
    g.set(x, ROOF + 1, z, WALL);        // parapet
    g.set(x, ROOF + 2, z, WALL);
    g.set(x, ROOF + 3, z, BAND);        // parapet cap
  } else {
    g.set(x, ROOF, z, SLAB);            // roof slab
  }
}

// Entrance on the street (minimum-z) face
let minZ = Infinity;
for (const [, z] of ground.keys().map(k => k.split(",").map(Number))) minZ = Math.min(minZ, z);
for (const [x, z, gy] of cells) {
  if (z !== minZ || has(x, z - 1)) continue;
  if (x !== 9 && x !== 10) continue;
  const side = x === 9 ? "left" : "right";
  g.set(x, gy, z, "oak_door", { facing: "north", half: "lower", hinge: side, open: "false", powered: "false" });
  g.set(x, gy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: side, open: "false", powered: "false" });
}

// Roof plant penthouse on a central core
const core = [];
for (const [x, z, gy] of cells) {
  if (x >= 6 && x <= 13 && z >= 9 && z <= 18) core.push([x, z]);
}
for (const [x, z] of core) {
  const coreEdge = x === 6 || x === 13 || z === 9 || z === 18;
  for (let y = ROOF + 1; y <= ROOF + 5; y++) {
    if (coreEdge) {
      const mull = (x + z) % 3 === 0;
      if (y === ROOF + 1 || y === ROOF + 5) g.set(x, y, z, BAND);
      else if (y === ROOF + 2 || y === ROOF + 3) g.set(x, y, z, mull ? MULLION : GLASS);
      else g.set(x, y, z, WALL);
    }
  }
  g.set(x, ROOF + 6, z, SLAB);          // penthouse roof
}
// small mechanical crown and antenna
for (let x = 8; x <= 11; x++) for (let z = 12; z <= 15; z++) {
  if (has(x, z)) g.set(x, ROOF + 7, z, SLAB);
}
for (let y = ROOF + 7; y <= ROOF + 10; y++) {
  if (has(9, 13)) g.set(9, y, 13, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
