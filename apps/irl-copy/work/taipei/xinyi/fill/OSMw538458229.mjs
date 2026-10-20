import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458229";
const W = 23, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: (x, z) -> ground height
const G = new Map();
const key = (x, z) => x * 4096 + z;
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const grd = (x, z) => G.get(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));

// Era: 1980s-90s Taipei commercial block, two storeys of ~5 blocks,
// light concrete facade with glass bays, quartz string courses, flat
// parapeted roof with a small mechanical penthouse.
const PLINTH = minG;            // base course (stone bricks)
const L1 = minG + 5;            // second-floor slab line
const L2 = minG + 10;           // roof slab / cornice line
const R = minG + 11;            // parapet top
const PEN_BASE = L2 + 1;        // penthouse walls start here
const PEN_TOP = L2 + 4;         // penthouse roof slab

const OUT = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const outFacing = { n: "north", s: "south", e: "east", w: "west" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exposed = (x, z) => Object.keys(OUT).filter((f) => !has(x + OUT[f][0], z + OUT[f][1]));
const alongOf = (x, z, f) => (f === "n" || f === "s" ? x : z);
const isCorner = (x, z, f) =>
  f === "n" || f === "s" ? !has(x - 1, z) || !has(x + 1, z) : !has(x, z - 1) || !has(x, z + 1);

// Edge records: each exposed face of each footprint cell
const edges = [];
for (const [x, z] of cells) for (const f of exposed(x, z)) edges.push({ x, z, f });

// Entrance: first available face in preference order, centred along that facade
const entF = ["s", "n", "e", "w"].find((f) => edges.some((e) => e.f === f));
const entAlong = edges
  .filter((e) => e.f === entF)
  .map((e) => alongOf(e.x, e.z, entF))
  .sort((a, b) => a - b);
const tc = entAlong[Math.floor(entAlong.length / 2)];

const glassProps = (f) =>
  f === "n" || f === "s"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

function wallSpec(x, z, f, y) {
  const a = alongOf(x, z, f);
  const corner = isCorner(x, z, f);
  const isEnt = f === entF && Math.abs(a - tc) <= 1;
  const isDoorCell = f === entF && a === tc;

  if (y === R) return { id: "white_concrete" };                 // parapet cap
  if (y === L2) return { id: "smooth_quartz" };                 // cornice
  if (y === minG + 4 || y === L1 + 4) {                         // string courses
    if (isEnt && y === minG + 4) {
      return { id: "stone_brick_stairs", props: { facing: outFacing[f], half: "top", shape: "straight", waterlogged: "false" } };
    }
    return { id: "smooth_quartz" };
  }
  if (y === PLINTH) return { id: "stone_bricks" };               // base course
  if (y === L1) return { id: "smooth_stone" };                   // floor line

  const inWin = (y > minG && y <= minG + 3) || (y > L1 && y <= L1 + 3);
  if (!inWin) return null;

  if (isDoorCell && (y === minG + 1 || y === minG + 2)) {
    return {
      id: "dark_oak_door",
      props: {
        facing: outFacing[f],
        half: y === minG + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }
  if (corner || (!isEnt && a % 3 === 0)) return { id: "light_gray_concrete" }; // piers
  return { id: "glass_pane", props: glassProps(f) };
}

// 1. Foundations, floor and roof slabs, and the facade
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (L1 >= gr) put(x, L1, z, "smooth_stone");
  if (L2 >= gr) put(x, L2, z, "smooth_stone");

  const fs = exposed(x, z);
  if (fs.length) {
    for (let y = gr; y <= R; y++) {
      const sp = wallSpec(x, z, fs[0], y);
      if (sp) put(x, y, z, sp.id, sp.props);
    }
  }
}

// 2. Rooftop penthouse (5x5 footprint, must sit fully on the roof deck)
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
let penOk = true;
for (let dx = -2; dx <= 2; dx++)
  for (let dz = -2; dz <= 2; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!has(x, z) || grd(x, z) > L2) penOk = false;
  }
if (penOk) {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const x = cx + dx, z = cz + dz;
      const ring = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
      if (!ring) continue;
      const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
      for (let y = PEN_BASE; y <= PEN_TOP - 1; y++) {
        if (y === PEN_BASE + 1 && !corner) {
          // window band on the penthouse walls
          const f = Math.abs(dx) === 2 ? "e" : "n";
          put(x, y, z, "glass_pane", glassProps(f));
        } else {
          put(x, y, z, "white_concrete");
        }
      }
    }
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) put(cx + dx, PEN_TOP, cz + dz, "smooth_quartz");
}

// 3. Warm lights behind some ground and upper windows (inside the air gap)
for (const e of edges) {
  const { x, z, f } = e;
  const a = alongOf(x, z, f);
  if (a % 6 !== 2) continue;
  if (isCorner(x, z, f)) continue;
  if (f === entF && Math.abs(a - tc) <= 1) continue;
  const [ox, oz] = OUT[f];
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz) || exposed(ix, iz).length) continue;
  const gi = grd(ix, iz);
  for (const y of [minG + 2, L1 + 2]) {
    if (y < gi) continue;
    put(ix, y, iz, y === minG + 2 ? "glowstone" : "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
