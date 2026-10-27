// Way 360119702, a 1930s Auckland commercial block on Maungawhau's slope: a basalt plinth that follows the ground,
// red brick piers and spandrels with quartz string courses, framed glass bays, a green glazed shopfront, a quartz
// cornice and brick parapet, and a stone lift overrun on the flat roof. Solid floor slabs per storey, air behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_360119702.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 30, Y = 31, Z = 27;
const CORNICE = 16;            // roof deck (the lidar roof is 18 everywhere, five cells at 17: smoothed to one flat tier)
const PARAPET = 17;            // parapet course on the perimeter, top of the building at 17
const FLOORS = [4, 8, 12];     // shared storey lines: a 4-block pitch, so upper floors line up across the slope
const BAY = 5;                 // along a face: pier | frame | glass | glass | frame

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inFp = (x, z) => ground.has(`${x},${z}`);
// the outward faces of a footprint cell (N = -z, S = +z, E = +x, W = -x); none means interior
const outDirs = (x, z) => [["N", !inFp(x, z - 1)], ["S", !inFp(x, z + 1)], ["E", !inFp(x + 1, z)], ["W", !inFp(x - 1, z)]]
  .filter(([, out]) => out).map(([d]) => d);

// the floor lines of a column whose ground is gr: the ground floor's slab at gr, then the shared upper lines at least 4 up
const floorLines = (gr) => [gr, ...FLOORS.filter((L) => L >= gr + 4)];
// what row y is on a column with ground gr: a floor line, the ground storey (shopfront), or an upper storey's window/spandrel
function rowKind(gr, y) {
  const lines = floorLines(gr);
  if (lines.includes(y)) return { kind: y === gr ? "base" : "string" };
  const s = Math.max(...lines.filter((L) => L < y)), next = lines.find((L) => L > y) ?? CORNICE;
  if (s === gr) {
    if (y === next - 1) return { kind: "fascia" };
    if (next - gr - 1 >= 5 && y === gr + 1) return { kind: "bulkhead" };
    return { kind: "window", shop: true };
  }
  return y - s === 3 ? { kind: "spandrel" } : { kind: "window" };
}

// the entrance: on the lowest east-facing run, in a bay (so it lands on a glass bay's column), mid-run
const eastBays = cells.filter(([x, z]) => outDirs(x, z).join() === "E" && [2, 3].includes(z % BAY));
const lowG = Math.min(...eastBays.map((c) => c[2]));
const lowRun = eastBays.filter((c) => c[2] === lowG).sort((a, b) => a[1] - b[1]);
const [doorX, doorZ] = lowRun[lowRun.length >> 1];

const g = new Voxels([X, Y, Z]);
const glass = [];      // window panes, connected after the rest is placed
const pockets = [];    // [x, y, z] air cells behind a window, inside the footprint

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const dirs = outDirs(x, z), per = dirs.length > 0, corner = dirs.length > 1;
  const u = dirs.includes("N") || dirs.includes("S") ? x : z;     // the coordinate along the face it stands on

  for (let y = 0; y < gr; y++) g.set(x, y, z, "deepslate_bricks");   // foundation up to the lidar ground
  for (let y = gr; y < CORNICE; y++) {
    const r = rowKind(gr, y);
    if (!per) { g.set(x, y, z, ["base", "string"].includes(r.kind) ? "smooth_stone" : "stone"); continue; }
    if (x === doorX && z === doorZ && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "iron_door", { facing: "west", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let b;
    if (r.kind === "base") b = "deepslate_tiles";
    else if (r.kind === "string") b = "smooth_quartz";
    else if (corner) b = "quartz_block";
    else if (r.kind === "fascia" || r.kind === "bulkhead") b = "black_glazed_terracotta";
    else if (r.kind === "spandrel") b = "smooth_quartz";
    else {
      const m = u % BAY;
      if (m === 0) b = r.shop ? "black_glazed_terracotta" : "bricks";
      else if (m === 1 || m === 4) b = "smooth_quartz";
      else b = "glass_pane";
    }
    g.set(x, y, z, b);
    if (b === "glass_pane") {
      glass.push([x, y, z]);
      const inner = [[x, z - 1], [x, z + 1], [x + 1, z], [x - 1, z]].find(([a, c]) => inFp(a, c) && outDirs(a, c).length === 0);
      if (inner) pockets.push([inner[0], y, inner[1], x, z]);
    }
  }
  // the roof deck (interior) and the cornice and parapet on the perimeter
  g.set(x, CORNICE, z, per ? (corner ? "quartz_block" : "smooth_quartz") : "gray_concrete");
  if (per) g.set(x, PARAPET, z, corner ? "quartz_block" : "bricks");
}

// air behind each glass bay, a warm glowstone in about one bay in four
for (const [ix, y, iz, wx, wz] of pockets) {
  g.set(ix, y, iz, (wx * 3 + wz * 5 + y) % 4 === 0 ? "glowstone" : "air");
}

// glass panes join their neighbours: a glass pane or any solid block along the wall (not the door)
for (const [x, y, z] of glass) {
  const joins = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return n && n.block !== "minecraft:iron_door" ? "true" : "false"; };
  g.set(x, y, z, "glass_pane", { north: joins(0, -1), south: joins(0, 1), east: joins(1, 0), west: joins(-1, 0), waterlogged: "false" });
}

// a stone lift overrun on the flat roof, the 4x4 interior square nearest the roof's centre
const pts = [...ground.keys()].map((k) => k.split(",").map(Number));
const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
let best = null;
for (const [x0, z0] of pts) {
  const sq = [];
  for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) sq.push([x0 + a, z0 + c]);
  if (!sq.every(([a, c]) => inFp(a, c) && outDirs(a, c).length === 0)) continue;
  const d = Math.hypot(x0 + 1.5 - cx, z0 + 1.5 - cz);
  if (!best || d < best.d) best = { d, x0, z0 };
}
if (best) {
  for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) {
    for (let y = 17; y < 19; y++) g.set(best.x0 + a, y, best.z0 + c, "stone_bricks");
    g.set(best.x0 + a, 19, best.z0 + c, "smooth_stone");
  }
}

const out = `${DIR}/way_360119702.nbt`;
const stats = g.save(out);
console.log(`footprint ${cells.length} cells, ${pockets.length} window bays, lift at ${best ? `${best.x0},${best.z0}` : "none"}, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
