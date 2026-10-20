import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538408126";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks, parapet to y=10, roof surface at y=11.
const ROOF_DECK = 10;   // solid roof deck top course (parapet sits here on edges)
const LINE_GF = 4;      // ground-floor lintel / sign band
const LINE_SLAB = 5;    // level-2 floor slab / storey line
const SILL = 6;         // upper-floor sill band
const LINTEL = 9;       // upper-floor lintel band

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), Math.min(Math.max(Math.round(gy), 0), LINE_GF));
}
const inside = (x, z) => ground.has(key(x, z));

const dirs = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

// 1. Foundation fill from y=0 up to each cell's ground.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Interior structure: floor slab at level 2, roof deck, and grid columns.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  g.set(x, LINE_SLAB, z, "light_gray_concrete");
  g.set(x, ROOF_DECK, z, "gray_concrete");
}
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  const edge = dirs.some(d => !inside(x + d.dx, z + d.dz));
  if (edge) continue;
  if (x % 4 === 0 && z % 4 === 0) {
    for (let y = gr; y <= LINTEL; y++) {
      if (y === LINE_SLAB || y === ROOF_DECK) continue;
      g.set(x, y, z, "white_concrete");
    }
  }
}

// 3. Warm interior lights behind some upper-floor windows.
const glowAt = new Set();
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  for (const d of dirs) {
    if (inside(x + d.dx, z + d.dz)) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (!inside(ix, iz)) continue;
    const along = (d.dx !== 0) ? z : x;
    if (along % 6 !== 1) continue;
    const ik = key(ix, iz);
    if (glowAt.has(ik)) continue;
    const interiorCell = dirs.every(e => inside(ix + e.dx, iz + e.dz));
    if (!interiorCell || (ix % 4 === 0 && iz % 4 === 0)) continue;
    glowAt.add(ik);
    g.set(ix, 7, iz, "glowstone");
  }
}

// 4. Facades, corners, shopfronts, entrance, windows, parapet.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  const outs = dirs.filter(d => !inside(x + d.dx, z + d.dz));
  if (outs.length === 0) continue;
  const corner = outs.length >= 2;

  for (let y = gr; y <= ROOF_DECK; y++) {
    // Base course at the foot of the building.
    if (y === gr && y < LINE_GF) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    // Parapet coping on the roof edge.
    if (y === ROOF_DECK) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    for (const d of outs) {
      const along = (d.dx !== 0) ? z : x;   // position along the face
      const isEntrance = d.name === "south" && along === 6 && gr + 2 <= 3;
      let block = null;
      let props;

      if (y === LINE_SLAB) {
        block = "smooth_stone";                       // storey line
      } else if (y === LINE_GF) {
        block = "light_gray_concrete";                // ground-floor sign band
      } else if (y === SILL || y === LINTEL) {
        block = "light_gray_concrete";                // spandrels
      } else if (corner || along % 3 === 0) {
        block = "white_concrete";                     // pillars
      } else if (y > gr && y < LINE_GF) {
        // Shopfront: glass, with a door at the entrance.
        if (isEntrance && (y === gr + 1 || y === gr + 2)) {
          block = "oak_door";
          props = {
            facing: d.name,
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else {
          block = "glass_pane";
        }
      } else if (y === 7 || y === 8) {
        block = "glass_pane";                         // upper windows
      } else if (y > LINE_SLAB && y < LINTEL) {
        block = "white_concrete";
      }

      if (!block) continue;
      if (corner && block === "glass_pane") block = "white_concrete";
      if (props) g.set(x, y, z, block, props);
      else g.set(x, y, z, block);
      break; // one face owns this cell's block on a corner
    }
  }

  // Lantern hanging at the entrance, so the door reads at dusk.
  if (outs.some(d => d.name === "south") && z === D - 1 && x === 6 && gr + 3 <= 3) {
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 5. Roof equipment: a small plant block on the deck with a lightning rod.
const cx = 6, cz = 6;
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    if (!inside(cx + dx, cz + dz)) continue;
    g.set(cx + dx, 11, cz + dz, "light_gray_concrete");
  }
}
if (inside(cx, cz)) {
  g.set(cx, 12, cz, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${dir}/${id}.nbt`);
