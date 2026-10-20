import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833594";
const W = 19, H = 23, D = 11;
const ROOF = 11;     // roof deck height (about 11 blocks above lowest ground)
const TOP = 13;      // parapet cap

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;

// Footprint: cell -> ground (foundation top)
const groundOf = new Map();
for (const c of raw) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  groundOf.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => groundOf.has(key(x, z));

const SIDES = ["S", "N", "E", "W"];
const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const exposed = (x, z, s) => !has(x + DV[s][0], z + DV[s][1]);

// Each perimeter cell gets one primary street-facing side
const primary = new Map();
for (const k of groundOf.keys()) {
  const [x, z] = k.split(",").map(Number);
  const s = SIDES.find((s) => exposed(x, z, s));
  if (s) primary.set(k, s);
}

// Entrance: middle cell of the first side (S preferred) that has exposed faces
let doorKey = null;
for (const s of SIDES) {
  const cand = [...primary.entries()]
    .filter(([, v]) => v === s)
    .map(([k]) => k.split(",").map(Number));
  if (!cand.length) continue;
  cand.sort((a, b) => (s === "N" || s === "S" ? a[0] - b[0] : a[1] - b[1]));
  const m = cand[Math.floor(cand.length / 2)];
  doorKey = key(m[0], m[1]);
  break;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b) => {
  if (b.props) g.set(x, y, z, b.id, b.props);
  else g.set(x, y, z, b.id);
};

// Facade block for a perimeter cell at height y
function facadeBlock(x, z, side, u, y, g0, isDoor) {
  if (y === g0) return { id: "stone_bricks" };                    // base course
  if (y <= 4) {                                                    // shopfront storey
    if (isDoor && y >= g0 + 1 && y <= g0 + 2 && g0 + 2 <= 4) {
      return {
        id: "dark_oak_door",
        props: {
          facing: FACING[side],
          half: y === g0 + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      };
    }
    if (u % 3 === 0) return { id: "stone_bricks" };                // pilasters
    if (y === g0 + 2 && (u + x + z) % 4 === 0) return { id: "glowstone" };
    return { id: "glass_pane" };
  }
  if (y === 5) return { id: "smooth_stone" };                       // storey line
  if (y <= 8) {                                                    // upper window grid
    if (u % 2 === 0) return { id: "light_gray_concrete" };         // mullions
    if (y === 7 && (u * 3 + x * 5 + z) % 9 === 0) return { id: "glowstone" };
    return { id: "glass_pane" };
  }
  if (y === 9) return { id: "light_gray_concrete" };               // spandrel
  if (y === 10) return { id: "stone_bricks" };                     // cornice
  if (y <= 12) return { id: "white_concrete" };                    // wall and parapet
  return { id: "stone_brick_slab", props: { type: "bottom" } };    // coping
}

for (const [k, g0] of groundOf) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");
  if (g0 > ROOF) continue;

  const side = primary.get(k);
  if (side) {
    const u = side === "N" || side === "S" ? x : z;
    const isDoor = k === doorKey;
    for (let y = g0; y <= TOP; y++) {
      put(x, y, z, facadeBlock(x, z, side, u, y, g0, isDoor));
    }
  } else {
    // Interior: air gap, with floor slabs per storey and the roof deck
    if (g0 <= 5) g.set(x, 5, z, "smooth_stone");
    if (g0 <= 10) g.set(x, 10, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Roof plant: a 2x2 iron AC unit on the interior cells nearest the centre
const interior = [...groundOf.keys()]
  .filter((k) => !primary.has(k) && groundOf.get(k) <= ROOF)
  .map((k) => k.split(",").map(Number));
if (interior.length) {
  const set = new Set(interior.map(([x, z]) => key(x, z)));
  const cx = interior.reduce((s, c) => s + c[0], 0) / interior.length;
  const cz = interior.reduce((s, c) => s + c[1], 0) / interior.length;
  let best = null, bestD = Infinity;
  for (const [x, z] of interior) {
    const cells = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!cells.every(([a, b]) => set.has(key(a, b)))) continue;
    const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
    if (d < bestD) { bestD = d; best = cells; }
  }
  if (best) for (const [a, b] of best) g.set(a, ROOF + 1, b, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
