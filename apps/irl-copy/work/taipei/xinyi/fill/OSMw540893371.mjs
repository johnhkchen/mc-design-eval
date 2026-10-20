import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540893371";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxG = Math.max(...cells.map((c) => c[2]));

// Roof deck level (lidar: roof ~11 above lowest ground), storey line between.
const DECK = Math.max(11, maxG + 4);
const Y1 = maxG + Math.max(3, Math.floor((DECK - maxG) / 2));

// Facade classification: front = south (max z), facing the street.
function face(x, z) {
  const n = !has(x, z + 1); // open to +z (south, front)
  const s = !has(x, z - 1); // open to -z (north, back)
  const w = !has(x - 1, z);
  const e = !has(x + 1, z);
  const count = [n, s, w, e].filter(Boolean).length;
  if (count === 0) return null;
  if (count >= 2) return { corner: true };
  if (n) return { corner: false, face: "south", li: x - minX };
  if (s) return { corner: false, face: "north", li: x - minX };
  if (w) return { corner: false, face: "west", li: z - minZ };
  return { corner: false, face: "east", li: z - minZ };
}
const isEdge = (x, z) => face(x, z) !== null;

// Door: south facade, local index near 7, not on a pier column (pier when li % 3 == 0).
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const f = face(x, z);
    if (!f || f.corner || f.face !== "south") continue;
    if (f.li % 3 === 0) continue;
    const d = Math.abs(f.li - 7);
    if (d < best) { best = d; doorKey = [x, z]; }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation below the ground line so nothing floats on a slope.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const f = face(x, z);
  const edge = f !== null;

  // Ground floor plinth and base course.
  if (edge) {
    g.set(x, gr, z, "polished_andesite");
    g.set(x, gr + 1, z, "stone_bricks");
  } else {
    g.set(x, gr, z, "smooth_quartz"); // interior floor slab
  }

  // Exterior walls: piers, glass bays, storey band, cornice.
  if (edge) {
    const pier = f.corner || f.li % 3 === 0;
    for (let y = gr + 1; y <= DECK - 1; y++) {
      let mat;
      if (y === gr + 1) mat = "stone_bricks";
      else if (y === DECK - 1) mat = "smooth_quartz";
      else if (y === Y1) mat = "smooth_quartz";
      else if (pier) mat = "white_concrete";
      else if (y >= gr + 2 && y <= DECK - 2) mat = "light_blue_stained_glass";
      else mat = "white_concrete";
      g.set(x, y, z, mat);
    }
  }

  // Storey floor slab (interior and under the band).
  if (!edge || Y1 > gr) g.set(x, Y1, z, "smooth_quartz");

  // Warm lights behind glass on interior cells (not on the perimeter).
  if (!edge && gr + 3 < Y1 && (x % 4 === 1) && (z % 5 === 2)) {
    g.set(x, gr + 3, z, "glowstone");
  }
  if (!edge && Y1 + 3 < DECK - 1 && (x % 5 === 3) && (z % 4 === 1)) {
    g.set(x, Y1 + 3, z, "shroomlight");
  }

  // Roof deck, parapet and cap.
  g.set(x, DECK, z, "light_gray_concrete");
  if (edge) {
    g.set(x, DECK + 1, z, "white_concrete");
    g.set(x, DECK + 2, z, "smooth_quartz_slab", { type: "bottom" });
  }
}

// Entrance on the south (front) facade: two-high door with frame.
if (doorKey) {
  const [dx, dz] = doorKey;
  const gr = gnd(dx, dz);
  g.set(dx, gr + 1, dz, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx, gr + 2, dz, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Frame above the door in the storey band line.
  g.set(dx, gr + 3, dz, "smooth_quartz");
}

// Rooftop mechanical penthouse, off-centre, interior cells only.
for (let x = minX + 4; x <= minX + 9; x++) {
  for (let z = minZ + 6; z <= minZ + 11; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, DECK + 1, z, "light_gray_concrete");
    g.set(x, DECK + 2, z, "light_gray_concrete");
  }
}

// Lightning rod mast on top of the penthouse centre.
{
  const mx = minX + 7, mz = minZ + 9;
  if (has(mx, mz) && !isEdge(mx, mz)) {
    for (let y = DECK + 3; y <= DECK + 5; y++) {
      g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
