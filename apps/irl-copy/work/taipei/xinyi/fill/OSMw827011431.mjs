import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011431";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 18. Roof about 26 blocks above lowest ground: read as a
// five-storey 1990s Taipei commercial/office block with white tiled piers,
// tinted glass bays, grey spandrels, a quartz-banded cornice and a rooftop
// mechanical box. Storey lines sit on absolute y = 5, 10, 15, 20.
const W = 23, H = 38, D = 18;
const ROOF = 25;          // roof deck (top of storey 5); parapet sits at ROOF+1 = 26
const STOREY = 5;

const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);

const g = new Voxels([W, H, D]);
const lights = [];

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr > ROOF) continue; // ground above the roof: nothing to build

  // Base course / ground slab on the foundation.
  g.set(x, gr, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Storey walls and floor slabs.
  for (let y = gr + 1; y < ROOF; y++) {
    const r = y % STOREY;
    if (!edge) {
      // Floor slab per storey, air gap otherwise (no interiors).
      if (r === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "white_concrete");                 // storey line
    } else if (r === 4) {
      g.set(x, y, z, "light_gray_concrete");            // spandrel
    } else {
      const shopfront = y < STOREY;                     // ground storey: no piers
      const pier = !shopfront && (x + z) % 3 === 0;
      if (pier) {
        g.set(x, y, z, "white_concrete");               // tiled pier / frame
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", GLASS);
        // Warm light behind some glass, on the inward side.
        if (r === 2 && (x + z) % 9 === 0) {
          const out = DIRS.find(([dx, dz]) => !has(x + dx, z + dz));
          if (out) lights.push([x - out[0], y, z - out[1]]);
        }
      }
    }
  }

  // Roof deck and parapet.
  if (gr <= ROOF) {
    g.set(x, ROOF, z, edge ? "white_concrete" : "light_gray_concrete");
  }
  if (edge && gr < ROOF) {
    g.set(x, ROOF + 1, z, "white_concrete");            // parapet
  }
}

// Warm lights behind glass.
for (const [x, y, z] of lights) {
  if (has(x, z) && y < ROOF) g.set(x, y, z, "glowstone");
}

// Cornice band under the parapet, quartz caps on the edge.
for (const [x, z] of cells) {
  if (isEdge(x, z) && Math.round(ground.get(`${x},${z}`)) < ROOF) {
    g.set(x, ROOF, z, "smooth_quartz");
  }
}

// Main entrance on the minZ face, nearest the centre.
const cx = (minX + maxX) / 2;
const front = cells.filter(c => c[1] === minZ)
  .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
if (front.length) {
  const [dx0, dz0, gr0raw] = front[0];
  const gr0 = Math.round(gr0raw);
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(dx0, gr0, dz0, "iron_door", { ...doorProps, half: "lower" });
  g.set(dx0, gr0 + 1, dz0, "iron_door", { ...doorProps, half: "upper" });
  // Canopy over the entrance, set into the facade.
  const cy = gr0 + 3;
  if (cy < ROOF) {
    for (const off of [-1, 0, 1]) {
      if (has(dx0 + off, dz0)) {
        g.set(dx0 + off, cy, dz0, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

// Rooftop mechanical box with a lightning rod.
const bx0 = 5, bx1 = 17, bz0 = 5, bz1 = 12;
for (let x = bx0; x <= bx1; x++) {
  for (let z = bz0; z <= bz1; z++) {
    if (!has(x, z)) continue;
    const perim = x === bx0 || x === bx1 || z === bz0 || z === bz1;
    g.set(x, ROOF + 1, z, "light_gray_concrete");       // plant deck
    if (perim) {
      g.set(x, ROOF + 2, z, "white_concrete");          // screen wall
      g.set(x, ROOF + 3, z, "white_concrete");
    }
  }
}
if (has(11, 8)) {
  g.set(11, ROOF + 2, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
