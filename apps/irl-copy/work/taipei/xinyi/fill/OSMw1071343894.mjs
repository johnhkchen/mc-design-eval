import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name; footprint 27 x 19; roof ~11 blocks above lowest ground.
// Read: a two-storey reinforced-concrete commercial block of the mid-20th-century
// Taipei type. Pale concrete walls with a stone plinth, a shopfront with a red sign
// band at ground level, two upper storeys of framed glazing, a cornice and a parapet,
// and a rooftop plant box. Warm light shows through a few windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343894";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const ROOF = 10;                       // roof deck height above the lowest ground
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);

// outward face of a footprint cell (first missing neighbour), or null if interior
const OUT = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function outward(x, z) {
  for (const [dx, dz] of OUT) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
}

// entrance: on the south face, the cell nearest the centre line
const front = cells.filter(([x, z]) => !has(x, z + 1)).map(([x, z]) => ({ x, z }));
const door = front.reduce((best, c) =>
  Math.abs(c.x - cx) < Math.abs(best.x - cx) ? c : best, front[0]);

function put(x, y, z, spec) {
  if (!spec) return;
  const [id, props] = spec;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// facade material for a perimeter voxel
function facade(x, z, y, gr, deck, out) {
  const local = y - gr;
  const u = out[0] !== 0 ? z : x;          // position along the wall
  const south = !has(x, z + 1);
  const isDoor = x === door.x && z === door.z;

  if (local === 0) return ["polished_andesite"];                        // base course
  if (y === deck - 1) return ["stone_brick_slab", { type: "top", waterlogged: "false" }]; // cornice

  if (isDoor && (local === 1 || local === 2)) {
    return ["dark_oak_door", {
      facing: "south", half: local === 1 ? "lower" : "upper",
      hinge: "left", open: "false", powered: "false",
    }];
  }
  if (south && local === 3 && Math.abs(x - door.x) <= 1) return ["red_concrete"]; // canopy band

  if (local <= 3) {                                                      // shopfront
    return u % 4 === 0 ? ["white_concrete"] : ["glass"];
  }
  if (local === 4) return ["red_concrete"];                              // sign band
  if (local === 5) return ["white_concrete"];                            // storey line
  if (local >= 6 && local <= 8) {                                        // upper glazing
    return u % 3 === 0
      ? ["white_concrete"]
      : ["glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" }];
  }
  return ["white_concrete"];
}

for (const [x, z, gr] of cells) {
  // foundation up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const deck = Math.max(ROOF, gr + 6);
  const out = outward(x, z);

  for (let y = gr; y <= deck + 1; y++) {
    if (y === deck + 1) {                                                // parapet
      if (out) g.set(x, y, z, "stone_brick_wall");
      continue;
    }
    if (y === deck) {                                                    // roof deck
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!out) {                                                          // interior floor slabs only
      if (y === gr || y === gr + 5) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const spec = facade(x, z, y, gr, deck, out);
    put(x, y, z, spec);

    // warm light behind a few windows: one cell inside, if the interior exists
    const local = y - gr;
    const u = out[0] !== 0 ? z : x;
    const isDoor = x === door.x && z === door.z;
    const glowLow = local === 2 && u % 8 === 2 && !isDoor;
    const glowUp = local === 7 && u % 6 === 1 && y < deck - 1;
    if (glowLow || glowUp) {
      const ix = x - out[0] * 2, iz = z - out[1] * 2;
      if (has(ix, iz) && !outward(ix, iz)) {
        g.set(ix, y, iz, glowLow ? "glowstone" : "shroomlight");
      }
    }
  }
}

// rooftop plant box near the centre, on footprint cells only
for (let x = cx - 3; x <= cx + 3; x++) {
  for (let z = cz - 2; z <= cz + 2; z++) {
    if (!has(x, z) || outward(x, z)) continue;
    const deck = Math.max(ROOF, gAt(x, z) + 6);
    g.set(x, deck + 1, z, "light_gray_concrete");
    g.set(x, deck + 2, z, "light_gray_concrete");
    g.set(x, deck + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
