import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE92-0057-1F-2.cells.json`, "utf8"));

const W = 9, H = 33, D = 7;
const g = new Voxels([W, H, D]);

// Roof surface sits at y=21 (lidar record). Four storeys of 5 blocks, base at y=0.
const ROOF = 21;
const key = (x, z) => `${x},${z}`;
const occ = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => occ.has(key(x, z));

const PANE = { north: "true", south: "true", east: "true", west: "true" };
const info = new Map();

// Classify each footprint cell: which faces are exposed.
for (const [x, z, gr] of cells) {
  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const exposed = Object.values(faces).filter(Boolean).length;
  info.set(key(x, z), { x, z, gr, faces, facade: exposed > 0, corner: exposed >= 2 });
}

// Pick the entrance: south-facing cell closest to the mean x of south-facing cells.
const southCells = [...info.values()].filter((c) => c.faces.S);
let doorKey = null;
if (southCells.length) {
  const mx = southCells.reduce((s, c) => s + c.x, 0) / southCells.length;
  const best = southCells.reduce((a, b) => (Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a));
  doorKey = key(best.x, best.z);
}

for (const c of info.values()) {
  const { x, z, gr, facade, corner } = c;

  // Foundation: solid from 0 up to the cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  if (!facade) {
    // Interior cell: floor slabs per storey, roof slab, a few warm lights, no walls.
    if (gr <= 0) g.set(x, 0, z, "smooth_stone");
    for (const y of [5, 10, 15, 20]) if (y >= gr) g.set(x, y, z, "light_gray_concrete");
    // One warm light per storey, behind the glass on alternating storeys.
    for (let k = 0; k < 4; k++) {
      const ly = 5 * k + 2;
      if (ly >= gr && (k % 2 === 0) && (x + z + k) % 4 === 0) g.set(x, ly, z, "glowstone");
    }
    if (ROOF >= gr) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Facade cell.
  for (let y = gr; y <= ROOF; y++) {
    let b;
    if (y === ROOF) {
      b = "white_concrete"; // parapet / roof edge
    } else if (y === 20) {
      b = "light_gray_concrete"; // top cornice band
    } else if (y === 19) {
      // Projecting-looking cornice course: stone brick under the top band.
      b = corner ? "white_concrete" : "stone_brick_slab";
    } else if (y === 0) {
      b = "polished_granite"; // base course
    } else {
      const k = Math.floor(y / 5);
      const rel = y - 5 * k;
      if (rel === 0 || rel === 4) {
        b = "light_gray_concrete"; // storey line / spandrel and lintel
      } else {
        // Window band: rel 1..3
        if (k === 0) {
          // Shopfront: continuous glass at ground floor, white frame at corners
          b = corner ? "white_concrete" : "light_blue_stained_glass_pane";
        } else {
          // Upper floors: mullioned grid
          b = corner || (x + z) % 2 === 0 ? "white_concrete" : "light_blue_stained_glass_pane";
        }
      }
    }
    if (b === "light_blue_stained_glass_pane") g.set(x, y, z, b, PANE);
    else if (b === "stone_brick_slab") g.set(x, y, z, b, { type: "top", waterlogged: "false" });
    else g.set(x, y, z, b);
  }

  // Warm lights behind one window per upper storey (visible at dusk).
  for (let k = 1; k < 4; k++) {
    const ly = 5 * k + 2;
    if (ly >= gr && (x + z + k) % 7 === 1 && !corner && !(ly === 2)) {
      g.set(x, ly, z, "shroomlight");
    }
  }

  // Entrance door and canopy on the chosen south cell.
  if (key(x, z) === doorKey && gr < ROOF) {
    // Solid wall above the door opening so the canopy rests on masonry, not glass.
    for (let y = gr + 2; y <= 3; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, gr, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

// Roof equipment: two small plant boxes on interior roof cells, sitting on the roof at y=21.
for (const [kx, kz] of [[2, 2], [6, 4]]) {
  const c = info.get(key(kx, kz));
  if (c && !c.facade && H > ROOF + 1) {
    g.set(kx, ROOF + 1, kz, "iron_block");
  }
}

g.save(`${DIR}/TPE92-0057-1F-2.nbt`);
