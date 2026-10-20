import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329397";
const W = 8, H = 18, D = 41;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cells.set(`${x},${z}`, { x, z, g: Math.max(0, Math.round(gr)), r: Math.round(rf) });
}
const has = (x, z) => cells.has(`${x},${z}`);
const get = (x, z) => cells.get(`${x},${z}`);

// Roof line: lidar median, lifted so every cell keeps at least 4 blocks of wall above its ground.
const roofs = [...cells.values()].map((c) => c.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...[...cells.values()].map((c) => c.g));
const T = Math.min(14, Math.max(medianRoof, maxG + 4, 6)); // top course (parapet) row

const g = new Voxels([W, H, D]);

// Glass bays: perimeter cells that are not piers (piers at every third position, and corners).
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const bayIsGlass = (x, z) => {
  const Wf = !has(x - 1, z), Ef = !has(x + 1, z);
  const alongZ = Wf || Ef;
  const p = alongZ ? z : x;
  return !isCorner(x, z) && p % 3 !== 0;
};

for (const c of cells.values()) {
  const { x, z } = c;
  const gr = c.g;
  const Wf = !has(x - 1, z);
  const Ef = !has(x + 1, z);
  const Nf = !has(x, z - 1);
  const Sf = !has(x, z + 1);
  const perim = Wf || Ef || Nf || Sf;
  const corner = isCorner(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: air gap, floor slabs at storey lines, stone roof deck at the top.
    for (let y = gr; y <= T - 1; y++) {
      if (y === T - 1) g.set(x, y, z, "stone");
      else if (y === gr || (y % 2 === 0 && y < T - 1)) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  const alongZ = Wf || Ef;
  const p = alongZ ? z : x;
  const pier = corner || (p % 3 === 0);
  const dx = Wf ? 1 : Ef ? -1 : 0;
  const dz = Nf ? 1 : Sf ? -1 : 0;
  const inward = !corner && has(x + dx, z + dz);

  for (let y = gr; y <= T; y++) {
    if (y === T) {
      g.set(x, y, z, "stone_brick_wall");                 // parapet
    } else if (y === T - 1) {
      g.set(x, y, z, "stone_bricks");                     // cornice course
    } else if (y === gr) {
      g.set(x, y, z, "stone_bricks");                     // base course
    } else if (y % 2 === 0) {
      // Brick spandrel; stone sill directly under each glass bay.
      const glassAbove = y + 1 < T - 1 && y + 1 > gr && !pier;
      g.set(x, y, z, glassAbove ? "stone_bricks" : "bricks");
    } else {
      // Window band: brick piers, glass bays with occasional warm light behind.
      if (pier) {
        g.set(x, y, z, "bricks");
      } else {
        g.set(x, y, z, "glass");
        if (inward && (p + y) % 4 === 0) g.set(x + dx, y, z + dz, "glowstone");
      }
    }
  }
}

// Entrances: oak door in a stone surround on the west wall (z=20) and east wall (z=30).
const doorSpecs = [
  { x: 0, z: 20, facing: "west", frame: [19, 21], dir: 1 },
  { x: 7, z: 30, facing: "east", frame: [29, 31], dir: -1 },
];
for (const d of doorSpecs) {
  const c = get(d.x, d.z);
  if (!c) continue;
  const gr = c.g;
  // Recess the door: clear the glass row and rebuild the door opening.
  for (const [y, half] of [[gr, "lower"], [gr + 1, "upper"]]) {
    g.set(d.x, y, d.z, "oak_door", {
      facing: d.facing,
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
  }
  // Stone surround: jambs on both sides and a lintel above.
  for (const fz of d.frame) {
    if (!has(d.x, fz)) continue;
    g.set(d.x, gr, fz, "stone_bricks");
    g.set(d.x, gr + 1, fz, "stone_bricks");
    g.set(d.x, gr + 2, fz, "stone_bricks");
  }
  if (has(d.x, d.z)) g.set(d.x, gr + 2, d.z, "stone_bricks");
  // Lantern on the lintel-level wall beside the door.
  const lanternZ = d.frame[0];
  if (has(d.x, lanternZ)) g.set(d.x, gr + 3, lanternZ, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof equipment: a brick chimney stack on the roof deck near the south end, if footprint allows.
const chimneyCells = [[2, 36], [3, 36], [2, 37], [3, 37]];
if (chimneyCells.every(([cx, cz]) => has(cx, cz)) && T + 2 <= H - 1) {
  for (const [cx, cz] of chimneyCells) {
    for (let y = T; y <= T + 2; y++) g.set(cx, y, cz, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
