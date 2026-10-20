import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE105-00997F";
const W = 19, H = 47, D = 16;

// Record: built 2016, 19 x 16 footprint, roof ~35 blocks above lowest ground.
// Read as a 7-storey (5 blocks each) white-clad office/mixed-use mid-rise with
// glass bays, a stone plinth and shopfront, a parapet, and a rooftop penthouse + mast.
const ROOF = 35;          // roof cap at y=35 (y=0 is lowest ground)
const STOREY = 5;
const STOREYS = 7;
const PENT_TOP = 40;      // penthouse roof slab at y=40
const MAST_TOP = 46;      // lightning rod tip at y=46 (grid height 47)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const exposed = (x, z, dx, dz) => !has(x + dx, z + dz);
const perim = (x, z) =>
  exposed(x, z, 1, 0) || exposed(x, z, -1, 0) || exposed(x, z, 0, 1) || exposed(x, z, 0, -1);

// Depth from the exterior (0 = perimeter cell), used for the penthouse setback.
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (perim(x, z)) { depth.set(`${x},${z}`, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(`${x},${z}`);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, key = `${nx},${nz}`;
    if (has(nx, nz) && !depth.has(key)) { depth.set(key, d + 1); queue.push([nx, nz]); }
  }
}
const dAt = (x, z) => depth.get(`${x},${z}`) ?? 0;

const g = new Voxels([W, H, D]);

// Facade block id for a perimeter cell at height y.
function facadeId(x, z, gr, y) {
  const k = Math.floor(y / STOREY);
  const r = y % STOREY;
  const exX = exposed(x, z, 1, 0) || exposed(x, z, -1, 0);
  const exZ = exposed(x, z, 0, 1) || exposed(x, z, 0, -1);
  const corner = exX && exZ;
  const u = exX ? z : x;               // position along the exposed face

  if (r === 0) {
    if (k === 0 && y === gr) return "stone_bricks";        // plinth course
    return "white_concrete";                                // storey line
  }
  if (r === 4) return "light_gray_concrete";                // head band / spandrel
  if (corner) return "white_concrete";                      // solid corner columns
  if (k === 0) {                                            // shopfront
    return u % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass";
  }
  if (u % 3 === 0) return "light_gray_concrete";            // mullion
  if (r === 1) return "stone_brick_slab";                   // window sill (bottom half)
  if (r === 2 && (u + k) % 5 === 2) return "glowstone";     // lit office behind glass
  return "light_blue_stained_glass";
}

// Pass 1: foundations, walls, floors, roof cap.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "light_gray_concrete");

  if (perim(x, z)) {
    for (let y = gr; y < ROOF; y++) {
      const id = facadeId(x, z, gr, y);
      if (id === "stone_brick_slab") {
        g.set(x, y, z, id, { type: "bottom", waterlogged: "false" });
      } else {
        g.set(x, y, z, id);
      }
    }
    g.set(x, ROOF + 1, z, "white_concrete"); // parapet
  } else {
    // Interior: floor slab per storey, air elsewhere (no interiors).
    for (let k = 0; k < STOREYS; k++) {
      const y = Math.max(gr, k * STOREY);
      if (y < ROOF) g.set(x, y, z, "smooth_stone");
    }
  }

  g.set(x, ROOF, z, "smooth_stone"); // roof cap on every footprint cell
}

// Pass 2: entrance on the south (+z) face: centre door, flanking glazed bays,
// and a continuous lintel/canopy line across the three bays.
const south = cells
  .filter(([x, z]) => exposed(x, z, 0, 1))
  .sort((a, b) => a[0] - b[0]);
if (south.length) {
  const mid = Math.floor(south.length / 2);
  const [ex, ez, eg] = south[mid];
  const bays = [south[mid - 1], south[mid], south[mid + 1]].filter(Boolean);
  for (const [bx, bz, bg] of bays) {
    for (let y = bg; y < bg + 3; y++) g.set(bx, y, bz, "light_blue_stained_glass");
    g.set(bx, bg + 3, bz, "light_gray_concrete");          // canopy / lintel line
  }
  g.set(ex, eg, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, eg + 1, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(ex, eg + 2, ez, "light_gray_concrete");          // door head
}

// Pass 3: rooftop penthouse setback (depth >= 3), then mast on its core.
const pent = cells.filter(([x, z]) => dAt(x, z) >= 3);
for (const [x, z] of pent) {
  for (let y = ROOF + 1; y < PENT_TOP; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, PENT_TOP, z, "smooth_stone");
}
if (pent.length) {
  const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
  const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
  const [mx, mz] = pent.reduce((best, c) => {
    const d = Math.hypot(c[0] - cx, c[1] - cz);
    const bd = Math.hypot(best[0] - cx, best[1] - cz);
    return d < bd ? c : best;
  });
  for (let y = PENT_TOP + 1; y < MAST_TOP; y++) g.set(mx, y, mz, "iron_bars");
  g.set(mx, MAST_TOP, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
