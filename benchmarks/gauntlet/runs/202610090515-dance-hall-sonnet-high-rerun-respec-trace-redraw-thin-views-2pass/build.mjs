// Art Deco Dance Hall — PASS 1: the FRONT FACE (trace.txt + depth.txt, cell for cell).
// Layout: x east (axis x=13, building x=1..25), y up, z south; the street face is NORTH (-z).
//   z=0..4  marquee / fins / piers (proud)    z=5 main wall plane    z>=6 recessed reveals
//   z=5..10 front slab (solid, carries the tower and spire)     z=11..34 plain rear hall (pass 2 owns it)
// frontFace() is self-contained; pass 2 may rewrite rearHall() without touching it.
import { readFileSync } from "node:fs";
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const g = new Grid([27, 30, 35]);
const WALL = 5;          // main wall plane (z)
const SLAB_BACK = 10;    // back face of the solid front slab
const AXIS = 13;

// ---------------------------------------------------------------- tracing -> grids
const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const trace = {}; // trace[y][x] = [r,g,b]
for (const line of readFileSync(HERE + "trace.txt", "utf8").split("\n")) {
  const m = line.match(/^y(\d+)\s+(.*)$/);
  if (m) trace[+m[1]] = m[2].trim().split(/\s+/).map(hex);
}
const depthRows = {}; // depth.txt column i is trace column x = i + 1
for (const line of readFileSync(HERE + "depth.txt", "utf8").split("\n")) {
  const m = line.match(/^y(\d+)\s+(.*)$/);
  if (m) depthRows[+m[1]] = m[2].trim().split(/\s+/);
}
const depthAt = (x, y) => {
  const t = depthRows[y]?.[x - 1];
  return t === undefined || t === "." ? null : +t;
};

// ---------------------------------------------------------------- colour -> block (material map)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const WALLS = {
  smooth_quartz: hex("dfd9c1"), cut_sandstone: hex("d8c390"), sandstone: hex("a79267"),
  blue_concrete: hex("2940a8"), black_concrete: hex("020a1b"), gold_block: hex("f0bb10"),
};
const GLASS = {
  light_blue_stained_glass: hex("85a8de"), yellow_stained_glass: hex("e9df71"),
  orange_stained_glass: hex("f5ad4d"), lime_stained_glass: hex("bfcfaf"),
};
const MARQUEE = { // only inside the marquee box
  sea_lantern: hex("f2e9a6"), diamond_block: hex("3ed3c6"), emerald_block: hex("47b17b"),
  honeycomb_block: hex("f0a010"), gold_block: hex("f0bb10"), lime_stained_glass: hex("bac566"),
};
const TIER_X = { 4: [8, 18], 5: [8, 18], 6: [8, 18], 7: [8, 18], 8: [10, 16], 9: [12, 14], 10: [13, 13] };
const inMarquee = (x, y) => TIER_X[y] !== undefined && x >= TIER_X[y][0] && x <= TIER_X[y][1];
const nearest = (c, set) => Object.entries(set).sort((a, b) => dist(c, a[1]) - dist(c, b[1]))[0][0];
const isDoor = (x, y) => y <= 2 && ((x >= 11 && x <= 12) || (x >= 14 && x <= 15));
const isBlackPane = (x, y, d) => y >= 1 && y <= 3 && d <= -1;

function classify(x, y, d) {
  const c = trace[y][x];
  if (inMarquee(x, y)) return nearest(c, MARQUEE);
  if (isDoor(x, y)) return "dark_oak_door";
  if (x === 13 && y === 18) return "glowstone";                       // sunburst centre
  if (x === 13 && y === 26) return "glowstone";                       // spire lamp
  if (x === 13 && y >= 23 && y <= 25) return "yellow_stained_glass";  // spire slit, amber
  const wall = nearest(c, WALLS);
  const glass = nearest(c, GLASS);
  if (d <= -1 && y >= 5 && dist(c, GLASS[glass]) < 60 && dist(c, GLASS[glass]) < dist(c, WALLS[wall])) return glass;
  if (wall === "black_concrete" && isBlackPane(x, y, d)) return "black_stained_glass_pane";
  if (wall === "sandstone" && x >= 3 && x <= 7 && y >= 12 && y <= 15) return "chiseled_sandstone"; // wing pediment
  if (wall === "sandstone" && x >= 19 && x <= 23 && y >= 12 && y <= 15) return "chiseled_sandstone";
  return wall;
}

const isGlassy = (b) => b.endsWith("stained_glass") || b.endsWith("_pane");
const backOf = (b) => (b === "black_stained_glass_pane" ? "black_concrete" : "smooth_quartz");

// ---------------------------------------------------------------- front face
// marquee tiers step back one block per course, so the gold top reads as a stepped roof
const marqueeBase = (y) => (y <= 7 ? 1 : y === 8 ? 2 : y === 9 ? 3 : 4);

function frontFace() {
  const cells = [];
  for (let y = 0; y <= 29; y++) {
    for (let x = 1; x <= 25; x++) {
      const d = depthAt(x, y);
      if (d === null) continue;
      const block = classify(x, y, d);
      const zf = inMarquee(x, y) && d >= 1 ? marqueeBase(y) + (2 - d) : WALL - d;
      cells.push({ x, y, d, block, zf });
      if (block === "dark_oak_door") {
        // 3 high opening: door (y0-1) + closed trapdoor transom (y2), black backing behind
        const half = y === 0 ? "lower" : y === 1 ? "upper" : null;
        const hinge = x === 11 || x === 15 ? "left" : "right";
        for (let z = zf; z <= SLAB_BACK; z++) g.set(x, y, z, "black_concrete");
        if (half) g.set(x, y, zf, ...B.door("dark_oak", "north", half, hinge));
        else g.set(x, y, zf, ...B.trapdoor("dark_oak", "north", "top", false));
        continue;
      }
      if (isGlassy(block)) {
        g.set(x, y, zf, block);
        for (let z = zf + 1; z <= SLAB_BACK; z++) g.set(x, y, z, backOf(block));
        continue;
      }
      // marquee: gold behind the face course so the stepped tops read gold
      const body = inMarquee(x, y) && d >= 1 ? "gold_block" : block;
      g.set(x, y, zf, block);
      for (let z = zf + 1; z <= SLAB_BACK; z++) g.set(x, y, z, body);
    }
  }
  return cells;
}

function frontDetail() {
  // spire: the stepped pinnacle becomes slopes (stairs ascend toward the axis) with a slab tip
  const slope = (x, y, facing) => g.set(x, y, WALL - 1, ...B.stairs("cut_sandstone", facing));
  slope(12, 28, "east"); slope(14, 28, "west");
  slope(11, 26, "east"); slope(15, 26, "west");
  g.set(13, 29, WALL - 1, ...B.slab("cut_sandstone"));
  // canopy under the marquee: three hanging lanterns on the door rhythm
  for (const x of [10, 13, 16]) g.set(x, 3, 2, ...B.lantern(true));
}

// ---------------------------------------------------------------- rear hall (plain; pass 2 redesigns it)
function rearHall() {
  const [x0, x1, z0, z1, top] = [1, 25, SLAB_BACK + 1, 34, 15];
  for (let x = x0; x <= x1; x++) for (let y = 0; y <= top; y++) for (let z = z0; z <= z1; z++) {
    const wallCell = x === x0 || x === x1 || z === z1 || y === top || y === 0;
    if (wallCell) g.set(x, y, z, y === 0 ? "black_concrete" : y === top ? "cut_sandstone" : "smooth_quartz");
  }
}

rearHall();
const cells = frontFace();
frontDetail();

g.save(HERE + "round-1.nbt");
console.log(JSON.stringify({ cells: cells.length, refused: g.refused?.length ?? 0 }));

if (process.env.MAP) {
  const sym = { smooth_quartz: ".", cut_sandstone: "t", sandstone: "s", chiseled_sandstone: "c", blue_concrete: "B", black_concrete: "K", gold_block: "G", glowstone: "*", sea_lantern: "L", diamond_block: "D", emerald_block: "E", honeycomb_block: "H", dark_oak_door: "d", black_stained_glass_pane: "k", light_blue_stained_glass: "b", yellow_stained_glass: "y", orange_stained_glass: "o", lime_stained_glass: "l" };
  for (let y = 29; y >= 0; y--) {
    let r = String(y).padStart(2) + " ";
    for (let x = 0; x <= 26; x++) { const c = cells.find((q) => q.x === x && q.y === y); r += c ? sym[c.block] ?? "?" : " "; }
    console.log(r);
  }
}
