import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020187";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 14, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y of that cell
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));

const L = Math.min(...cells.map(c => c[2]));   // lowest ground under the footprint
const TOP = L + 10;                            // roof deck level (walls L..L+9)
const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxX = Math.max(...cells.map(c => c[0]));

// Which sides of a cell face outside the footprint
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ face: "north", inX: 0, inZ: 1, along: x });
  if (!has(x, z + 1)) f.push({ face: "south", inX: 0, inZ: -1, along: x });
  if (!has(x - 1, z)) f.push({ face: "west", inX: 1, inZ: 0, along: z });
  if (!has(x + 1, z)) f.push({ face: "east", inX: -1, inZ: 0, along: z });
  return f;
}

// Front entrance: north face, cell nearest the middle of the north edge
const northCells = cells.filter(([x, z]) => !has(x, z - 1)).map(c => c[0]).sort((a, b) => a - b);
const doorX = northCells.length
  ? northCells[Math.floor(northCells.length / 2)]
  : Math.round((minX + maxX) / 2);

// Pass 1: foundations, floor slabs, decks, walls
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab for the upper storey (interior and perimeter), only where ground is below it
  if (gr <= L + 5) g.set(x, L + 5, z, "smooth_quartz");

  const top = Math.max(TOP, gr);
  const faces = exposedFaces(x, z);
  const perimeter = faces.length > 0;

  // Roof deck
  g.set(x, top, z, "gray_concrete");

  if (!perimeter) continue;

  const corner = faces.length >= 2;
  const f = faces[0];

  for (let y = gr; y < top; y++) {
    const rel = y - L;
    let block;

    if (corner) {
      block = "smooth_quartz";
    } else if (rel <= 3) {
      // Ground floor shopfront: glass bays with pilasters
      block = f.along % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
    } else if (rel === 4) {
      block = "light_gray_concrete";      // storey line
    } else if (rel === 5) {
      block = "smooth_quartz";            // sill / floor line
    } else if (rel >= 6 && rel <= 8) {
      // Upper storeys: window grid with mullions
      block = f.along % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass";
    } else if (rel >= 9) {
      block = "light_gray_concrete";      // lintel / cornice band
    } else {
      block = "smooth_quartz";
    }

    g.set(x, y, z, block);
  }

  // Parapet on the roofline
  g.set(x, top + 1, z, "smooth_quartz");

  // Warm lights behind some upper-floor windows (air gap one block inside)
  if (!corner) {
    const inX = x + f.inX, inZ = z + f.inZ;
    const rel = 7;
    if (has(inX, inZ) && exposedFaces(inX, inZ).length === 0 &&
        f.along % 3 !== 0 && f.along % 6 === 1 && L + rel >= gr && L + rel < top) {
      g.set(inX, L + rel, inZ, "shroomlight");
    }
  }
}

// Pass 2: entrance on the north face
for (const [x, z, gr] of cells) {
  if (x === doorX && z === minZ && has(x, z)) {
    // Clear the wall cells for the door opening (lower and upper halves)
    g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Glass transom above the door
    if (gr + 2 <= TOP - 1) g.set(x, gr + 2, z, "light_blue_stained_glass");
  }
}

// Pass 3: rooftop water tank and plant-box, a simple roof equipment set
for (const [x, z, gr] of cells) {
  const top = Math.max(TOP, gr);
  const interior = exposedFaces(x, z).length === 0;
  const dx = x - minX, dz = z - minZ;
  if (interior && dx >= 4 && dx <= 5 && dz >= 3 && dz <= 4) {
    g.set(x, top + 1, z, "light_gray_concrete");
    if (dz === 3) g.set(x, top + 2, z, "iron_block");
  }
  if (interior && dx === 9 && dz >= 1 && dz <= 2) {
    g.set(x, top + 1, z, "moss_block");
  }
}

g.save(`${dir}/${id}.nbt`);
