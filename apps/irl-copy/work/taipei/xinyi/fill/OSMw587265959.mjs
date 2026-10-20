import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265959";
const W = 17, H = 16, D = 19;

// Record: footprint 17 x 19, roof ~4 blocks above lowest ground.
// Read as a single-storey low commercial pavilion / shophouse: concrete-clad
// with a stone plinth, glazed shopfront bays on a 3-block grid, flat roof,
// parapet, and a rooftop plant box.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

const grounds = [...ground.values()];
const minG = Math.min(...grounds);
const maxG = Math.max(...grounds);
// Roof sits about 4 blocks above lowest ground; high cells still get a storey above them.
const R = Math.max(minG + 4, maxG + 3);

const dirs = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const opp = { north: "south", south: "north", west: "east", east: "west" };
const missingOf = (x, z) =>
  Object.keys(dirs).filter(d => !has(x + dirs[d][0], z + dirs[d][1]));

const g = new Voxels([W, H, D]);

// Pass 1: foundation, floor slab, roof deck, parapet.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");        // foundation
  g.set(x, gr, z, "polished_andesite");                              // floor slab
  g.set(x, R - 1, z, "gray_concrete");                               // roof deck
  if (missingOf(x, z).length > 0) {
    g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet
  }
}

// Pass 2: walls, plinth, pillars, glazing per face.
for (const [x, z, gr] of cells) {
  const miss = missingOf(x, z);
  if (miss.length === 0) continue;
  for (let y = gr + 1; y <= R - 2; y++) {
    if (miss.length >= 2) {
      g.set(x, y, z, "gray_concrete");                               // corner column
      continue;
    }
    const face = miss[0];
    const along = (face === "north" || face === "south") ? x : z;
    const pillar = along % 3 === 0;
    if (y === gr + 1) {
      g.set(x, y, z, pillar ? "gray_concrete" : "stone_bricks");     // base course
    } else if (pillar) {
      g.set(x, y, z, "white_concrete");                              // mullion/pier
    } else {
      // Glass pane, connected along the wall line.
      const conn = (face === "north" || face === "south")
        ? { east: "true", west: "true" }
        : { north: "true", south: "true" };
      g.set(x, y, z, "glass_pane", { ...conn, waterlogged: "false" });
    }
  }
}

// Pass 3: entrance on the south (z max) face, nearest the middle.
const mid = (W - 1) / 2;
let door = null;
for (const [x, z, gr] of cells) {
  const miss = missingOf(x, z);
  if (miss.length !== 1) continue;
  const face = miss[0];
  if (face !== "south") continue;
  if (gr + 2 > R - 2) continue;
  if (!door || Math.abs(x - mid) < Math.abs(door.x - mid)) door = { x, z, gr, face };
}
if (door) {
  const { x, z, gr, face } = door;
  g.set(x, gr + 1, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Hanging lantern just inside the entrance.
  const ox = x - dirs[face][0], oz = z - dirs[face][1]; // inward is opposite of outward
  const ix = x + dirs[opp[face]][0], iz = z + dirs[opp[face]][1];
  if (has(ix, iz) && missingOf(ix, iz).length === 0) {
    g.set(ix, R - 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: warm light behind some shopfront glass (interior glowstone).
for (const [x, z, gr] of cells) {
  const miss = missingOf(x, z);
  if (miss.length !== 1) continue;
  const face = miss[0];
  const along = (face === "north" || face === "south") ? x : z;
  if (along % 6 !== 1) continue;
  const y = gr + 2;
  if (y > R - 2) continue;
  const ix = x + dirs[opp[face]][0], iz = z + dirs[opp[face]][1];
  if (!has(ix, iz)) continue;
  if (missingOf(ix, iz).length !== 0) continue;
  g.set(ix, gOf(ix, iz) + 2, iz, "glowstone");
}

// Pass 5: rooftop plant box near centre, with a small lantern-lit cap.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!has(x, z) || missingOf(x, z).length !== 0) continue;
    g.set(x, R, z, "light_gray_concrete");
  }
}
if (has(cx, cz) && missingOf(cx, cz).length === 0) {
  g.set(cx, R + 1, cz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
