import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 23 Middagh Street, Brooklyn Heights: an 1834 Federal / early Greek Revival
// brick rowhouse on a stone foundation. Red brick walls, stone base course and
// string courses, a stone-capped cornice and parapet, a flat roof, one brick
// chimney, a centred entrance door, and glass-pane windows with some warm
// lights behind them. Front (street) face is the lowest z row; rear is the highest.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001538";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 24, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(([x, z]) => key(Math.round(x), Math.round(z))));
const has = (x, z) => have.has(key(x, z));
const minX = Math.min(...cells.map(c => Math.round(c[0])));
const maxX = Math.max(...cells.map(c => Math.round(c[0])));
const minZ = Math.min(...cells.map(c => Math.round(c[1])));
const maxZ = Math.max(...cells.map(c => Math.round(c[1])));
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Smoothed building-wide massing: one ground datum and one roof level,
// so the tiers stay flat instead of following lidar noise cell by cell.
const grounds = cells.map(c => Math.max(0, Math.round(c[2])));
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const ground0 = Math.min(...grounds);
const roofLevel = Math.min(H - 4, Math.max(ground0 + 6, roofs[Math.floor(roofs.length / 2)]));
const h = roofLevel - ground0;
const N = Math.max(2, Math.round(h / 3));          // storeys
const fh = Math.max(3, Math.floor(h / N));          // storey height in blocks
const top = ground0 + N * fh;                       // roof deck row, shared by all cells

const isFloorRow = y => y >= ground0 && y <= top && (y - ground0) % fh === 0;

const cellsInfo = cells.map(c => {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  return { x, z, g: Math.max(0, Math.round(c[2])), p: perim(x, z) };
});

// 1. Foundations, walls, floor slabs and storey lines
for (const c of cellsInfo) {
  const { x, z, g: gc, p } = c;
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gc; y <= top; y++) {
    if (p) {
      if (y === gc) g.set(x, y, z, "stone_bricks");          // base course
      else if (isFloorRow(y)) g.set(x, y, z, "smooth_stone"); // string course / cornice
      else g.set(x, y, z, "bricks");
    } else {
      if (y === gc || isFloorRow(y)) g.set(x, y, z, "spruce_planks"); // interior floors
    }
  }
}

// 2. Windows, warm lights, entrance
for (const c of cellsInfo) {
  const { x, z, g: gc, p } = c;
  if (!p) continue;
  const front = z === minZ, back = z === maxZ;
  const sideW = x === minX, sideE = x === maxX;
  const xi = x - minX, zi = z - minZ;

  for (let k = 0; k < N; k++) {
    const b = ground0 + k * fh;
    for (let y = Math.max(b + 1, gc + 1); y <= b + fh - 1; y++) {
      if (front || back) {
        if (front && k === 0 && xi === 2) continue; // door column
        if (xi % 3 !== 1) continue;
        g.set(x, y, z, "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
        if ((xi + zi + k * 2) % 3 === 0) {
          const iz = front ? z + 1 : z - 1;
          if (has(x, iz) && !perim(x, iz)) g.set(x, y, iz, "glowstone");
        }
      } else if (sideW || sideE) {
        if (zi % 3 !== 1) continue;
        g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        if ((zi + k * 2) % 3 === 1) {
          const ix = sideW ? x + 1 : x - 1;
          if (has(ix, z) && !perim(ix, z)) g.set(ix, y, z, "glowstone");
        }
      }
    }
  }

  // Centred entrance on the street face, ground storey
  if (front && xi === 2) {
    g.set(x, gc + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gc + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (has(x, z + 1) && !perim(x, z + 1)) {
      g.set(x, gc + 2, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// 3. Parapet on the perimeter, one brick chimney on an interior cell
for (const c of cellsInfo) {
  if (c.p) g.set(c.x, top + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
const chim = cellsInfo.find(c => !c.p && c.x === minX + 1 && c.z === minZ + 2);
if (chim) {
  for (let y = top + 1; y <= top + 3; y++) g.set(chim.x, y, chim.z, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
