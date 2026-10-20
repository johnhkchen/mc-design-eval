import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw589862420";
const W = 22, D = 18, H = 41;

// Roof top sits 29 blocks above the lowest ground (y 0). Five-block storeys,
// roof deck on storey line y=25, parapet 26..28, plant core to y=33, mast to 36.
const DECK = 25;
const PARAPET_TOP = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Outward faces of a footprint cell (neighbour missing = exterior side)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
// Inward offset from a face cell (into the building)
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Penthouse / plant core footprint (interior, well inside the edges)
const inCore = (x, z) => x >= 7 && x <= 14 && z >= 5 && z <= 12;

for (const [x, z, gr] of cells) {
  const ground0 = Math.max(0, Math.round(gr));

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < ground0; y++) g.set(x, y, z, "stone_bricks");

  const f = faces(x, z);

  if (f.length === 0) {
    // Interior cell: floor slabs only, air between (no interiors)
    const floors = new Set([ground0]);
    for (let y = 0; y <= DECK; y += 5) if (y >= ground0) floors.add(y);
    for (const y of floors) if (y <= DECK) g.set(x, y, z, "light_gray_concrete");

    // Roof plant boxes outside the core
    if (!inCore(x, z) && (x * 5 + z * 3) % 17 === 0) {
      g.set(x, DECK + 1, z, "light_gray_concrete");
      g.set(x, DECK + 2, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = f.length > 1;
  const face = f[0];
  const u = face === "north" || face === "south" ? x : z; // position along the face

  for (let y = ground0; y <= PARAPET_TOP; y++) {
    if (y > DECK) {
      // Parapet with a cap
      if (y === PARAPET_TOP) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    const k = Math.floor(y / 5);
    const r = y % 5;

    // Storey line / base course
    if (r === 0) {
      g.set(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete");
      continue;
    }

    // Ground-floor lintel band
    if (k === 0 && r === 4) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Corners are solid piers
    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Entrance: single door on the south face, centre column
    if (face === "south" && x === 10 && k === 0) {
      if (y === ground0) {
        g.set(x, y, z, "polished_granite"); // sill under the door
        continue;
      }
      if (y === ground0 + 1 && ground0 + 2 <= 4) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === ground0 + 2 && ground0 + 2 <= 4) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === ground0 + 3 && ground0 + 3 <= 4) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }

    // Window bays on a 3-cell rhythm with solid piers
    const pier = u % 3 === 0;
    if (pier) {
      g.set(x, y, z, k === 0 ? "white_concrete" : "white_concrete");
      continue;
    }

    const glazing = k === 0 ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane";
    const props = face === "north" || face === "south" ? PANE_EW : PANE_NS;
    g.set(x, y, z, glazing, props);

    // Warm light behind some panes (glowstone inside the air gap)
    if (k >= 1 && (x * 31 + z * 17 + y * 7) % 9 === 0) {
      const [dx, dz] = INWARD[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && faces(ix, iz).length === 0 && y !== DECK) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Roof deck over every footprint cell already set by the floor pass; ensure it is solid
for (const [x, z] of cells) {
  if (!faces(x, z).length) g.set(x, DECK, z, "light_gray_concrete");
}

// Plant core: louvred ring walls to y 32, solid cap at y 33
for (let x = 7; x <= 14; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z)) continue;
    const ring = x === 7 || x === 14 || z === 5 || z === 12;
    for (let y = DECK + 1; y <= 32; y++) {
      if (ring) {
        if (y % 2 === 0) g.set(x, y, z, "light_gray_concrete");
        else g.set(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      }
    }
    g.set(x, 33, z, "light_gray_concrete");
  }
}

// Mast on top of the core
g.set(10, 34, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
