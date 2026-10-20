import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466772";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 21 x 19. Era: late-1990s/2000s Xinyi mid-rise office block with
// pale tiled cladding, blue-tinted glazing, light-grey piers and a stone base.
// Five storeys of 5 blocks each, roof parapet at y = 26.
const W = 21, H = 38, D = 19;
const ROOF = 26;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Exposed faces in preference order: south (street/entrance side), east, north, west.
const FACES = [
  { name: "S", dx: 0, dz: 1 },
  { name: "E", dx: 1, dz: 0 },
  { name: "N", dx: 0, dz: -1 },
  { name: "W", dx: -1, dz: 0 },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Storey bands: floor slab at 1 + 5k, glazing at offsets 1..3, spandrel at offset 4.
function bandOf(y) {
  const k = clamp(Math.floor((y - 1) / 5), 0, 4);
  return { k, off: y - (1 + 5 * k) };
}

// ---- Main pass: foundation, base, walls, windows, floors, roof deck ----
const lights = [];
for (const [x, z, gr] of cells) {
  const faces = FACES.filter((f) => !inside(x + f.dx, z + f.dz));
  const perim = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF - 1; y++) {
    if (y === gr) {
      // Base course on the facade, floor slab inside.
      g.set(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    const { k, off } = bandOf(y);

    if (!perim) {
      if (y === ROOF - 1) g.set(x, y, z, "gray_concrete");          // roof deck
      else if (off === 0) g.set(x, y, z, "light_gray_concrete");   // storey slab
      continue;                                                     // else air behind glass
    }

    const f = faces[0];
    const a = f.dz !== 0 ? x : z; // position along the face
    if (y === ROOF - 1) {
      g.set(x, y, z, "smooth_quartz");                              // cornice
    } else if (off === 0) {
      g.set(x, y, z, "smooth_quartz");                              // storey line
    } else if (off === 4) {
      g.set(x, y, z, "white_concrete");                             // spandrel
    } else {
      // off 1..3: window zone
      if (a % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");                      // pier
      } else {
        g.set(x, y, z, "light_blue_stained_glass");                 // glazing
        if (off === 2 && a % 3 === 1 && k % 2 === 0) {
          const ix = x - f.dx, iz = z - f.dz;
          if (inside(ix, iz) && !FACES.some((ff) => !inside(ix + ff.dx, iz + ff.dz))) {
            lights.push([ix, y, iz]);
          }
        }
      }
    }
  }
}

// Warm light behind selected glazing (glowstone in the air gap).
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// Parapet on the perimeter at the roof level.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const perim = FACES.some((f) => !inside(x + f.dx, z + f.dz));
  if (perim) g.set(x, ROOF, z, "stone_bricks");
}

// ---- Street entrance on the south face, nearest the middle of the frontage ----
const front = cells.filter(([x, z]) => !inside(x, z + 1));
if (front.length) {
  const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const [dx0, dz0, gr0] = front.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);

  // Flanking piers and lintel frame the door.
  for (const xs of [dx0 - 1, dx0 + 1]) {
    if (!inside(xs, dz0)) continue;
    const gs = ground.get(key(xs, dz0));
    for (let y = gs + 1; y <= gs + 3 && y < ROOF; y++) g.set(xs, y, dz0, "stone_bricks");
  }
  g.set(dx0, gr0 + 1, dz0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx0, gr0 + 2, dz0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx0, gr0 + 3, dz0, "smooth_stone");                           // lintel
  g.set(dx0, gr0 + 4, dz0, "smooth_quartz");                          // door head course
}

// ---- Roof plant: a mechanical box on the deck with a small vent ----
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (const [x, z, gr] of cells) {
  const perim = FACES.some((f) => !inside(x + f.dx, z + f.dz));
  if (perim) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) {
    g.set(x, ROOF, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) g.set(x, ROOF + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
