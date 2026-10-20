import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw452575259";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 34 x 23; roof about 12 blocks above lowest ground.
// Read as a late-1990s/early-2000s Xinyi commercial-office block:
// white concrete and quartz bands, cyan tinted glass in grey mullion piers,
// a granite plinth, a shopfront ground storey, and a rooftop plant screen.
const W = 34, H = 24, D = 23;
const ROOF = 12;

const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

// Front (north, low z) row and entrance at its middle
const frontRow = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = frontRow.length
  ? frontRow[Math.floor(frontRow.length / 2)]
  : [Math.floor(W / 2), 0];

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z] of cells) {
  const gr = G.get(`${x},${z}`);
  if (gr >= ROOF) continue;

  // Foundation under the cell up to its own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  const exX = !has(x - 1, z) || !has(x + 1, z);
  const exZ = !has(x, z - 1) || !has(x, z + 1);
  const ext = exX || exZ;
  const bay = exX ? z : x;
  const isFront = !has(x, z - 1);

  for (let y = gr; y < ROOF; y++) {
    const rel = y - gr;

    if (!ext) {
      // Interior: air, with a floor slab per storey
      if (rel === 0 || rel % 5 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance door and canopy on the front row
    if (isFront && x === doorX && z === doorZ) {
      if (rel === 1) { g.set(x, y, z, "dark_oak_door", DOOR_LOWER); continue; }
      if (rel === 2) { g.set(x, y, z, "dark_oak_door", DOOR_UPPER); continue; }
    }
    if (isFront && rel === 3 && Math.abs(x - doorX) <= 1) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, "polished_granite");           // base course / plinth
    } else if (rel % 5 === 0) {
      g.set(x, y, z, "smooth_quartz");              // storey belt course
    } else if (rel % 5 === 4) {
      g.set(x, y, z, "white_concrete");             // spandrel below each window band
    } else {
      // Window band: glass bays separated by grey piers every third bay
      if (bay % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");      // mullion / pier
      } else {
        const floor = Math.floor(rel / 5);
        if (rel % 5 === 2 && (bay + floor * 2) % 5 === 0) {
          g.set(x, y, z, "glowstone");              // warm lit office behind glass
        } else {
          g.set(x, y, z, "cyan_stained_glass");
        }
      }
    }
  }

  // Roof deck
  g.set(x, ROOF, z, "light_gray_concrete");

  // Parapet on exterior edges
  if (ext) g.set(x, ROOF + 1, z, "smooth_quartz");

  // Rooftop plant screen in the central part of the roof
  const cx = W / 2, cz = D / 2;
  if (!ext && Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 4) {
    g.set(x, ROOF + 1, z, "stone_bricks");
    g.set(x, ROOF + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
