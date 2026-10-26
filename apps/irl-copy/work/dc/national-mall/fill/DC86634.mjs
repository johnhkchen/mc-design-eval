import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86634.cells.json`, "utf8"));

// 1616 L St NW: mid-century office block, precast concrete with bands of
// tinted glazing, granite base, stone foundation, cornice, parapet and roof plant.
const W = 18, H = 31, D = 19;
const g = new Voxels([W, H, D]);

// Normalise the lidar record: round to two-block storeys, clamp to the build box.
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.round(gr);
  let roof = 2 * Math.round(Math.round(rf) / 2);
  roof = Math.max(ground + 4, Math.min(30, roof));
  cm.set(`${x},${z}`, { x, z, ground, roof });
}
const has = (x, z) => cm.has(`${x},${z}`);

const SPANDREL = "light_gray_concrete";   // floor lines and spandrel panels
const PIER = "white_concrete";            // mullions and corner piers
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_granite";          // ground-floor base course
const FOUND = "stone_bricks";             // foundation under sloped ground
const CORNICE = "smooth_stone";           // projecting-looking cornice course
const PARAPET = "smooth_stone_slab";      // parapet cap
const DECK = "stone";                     // lighter roof deck
const LOBBY = "gray_stained_glass_pane";  // entrance glazing

// Front (street) face: smallest z among perimeter cells.
const frontCells = [...cm.values()].filter(c => !has(c.x, c.z - 1)).sort((a, b) => a.x - b.x);
const door = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

for (const c of cm.values()) {
  const { x, z, ground, roof } = c;
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const perimeter = nN || nS || nW || nE;
  const corner = (nN || nS) && (nW || nE);
  const onFront = nN && door && Math.abs(x - door.x) <= 3 && z === 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  for (let y = ground; y <= roof - 1; y++) {
    const rel = y - ground;

    if (!perimeter) {
      // Interior: floor slabs and roof deck only; air between them.
      if (y === roof - 1) g.set(x, y, z, DECK);
      else if (rel % 2 === 0) g.set(x, y, z, SPANDREL);
      else if (rel === 1 && (x * 3 + z) % 11 === 0) g.set(x, y, z, "lantern"); // sparse warm light
      continue;
    }

    if (y === roof - 1) { g.set(x, y, z, PARAPET); continue; }      // parapet cap
    if (y === roof - 2) { g.set(x, y, z, CORNICE); continue; }      // cornice course
    if (rel === 0) { g.set(x, y, z, BASE); continue; }              // base course

    // Ground-floor storefront / lobby on the street face.
    if (onFront && rel <= 2) {
      if (door && x === door.x && z === 0 && rel <= 1) {
        // door handled after the loop
        continue;
      }
      if (rel === 1) { g.set(x, y, z, LOBBY); continue; }
      g.set(x, y, z, PIER); // lintel course above lobby
      continue;
    }

    if (rel % 2 === 0) { g.set(x, y, z, SPANDREL); continue; }      // storey line / spandrel

    // Window rows.
    if (corner) { g.set(x, y, z, PIER); continue; }
    const t = (nN || nS) ? x : z;                                    // position along the exposed face
    if (t % 3 === 0) g.set(x, y, z, PIER);                           // mullion
    else g.set(x, y, z, GLASS);
  }

  // Rooftop plant on a sparse grid of interior cells.
  if (!perimeter && x % 6 === 3 && z % 6 === 3 && roof + 1 <= 30) {
    g.set(x, roof, z, SPANDREL);
    g.set(x, roof + 1, z, PARAPET);
  }
}

// Main entrance: centre of the street-facing face, framed by piers.
if (door) {
  const { x, z, ground } = door;
  g.set(x, ground, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm light in the lintel above the door.
  g.set(x, ground + 2, z, "shroomlight");
}

g.save(`${DIR}/DC86634.nbt`);
