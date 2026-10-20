import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098875";
const W = 27, H = 23, D = 17;
const ROOF_Y = 11;      // roof deck, 11 blocks above lowest ground
const CAP_Y = 13;       // parapet cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity;
for (const [x, z, gy] of cells) {
  groundAt.set(key(x, z), gy);
  if (gy < minG) minG = gy;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
}
const inF = (x, z) => x >= 0 && x < W && z >= 0 && z < D && groundAt.has(key(x, z));
const gr = (x, z) => Math.min(9, groundAt.get(key(x, z)) - minG);
const isWall = (x, z) =>
  inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));
const isInterior = (x, z) => inF(x, z) && !isWall(x, z);
const faces = (x, z) => ({
  N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z),
});
const midX = (minX + maxX) / 2;

// Entrance: south-facing wall cell on the lowest ground, nearest the middle of the front.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!isWall(x, z) || !faces(x, z).S || gr(x, z) > 1) continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; doorKey = key(x, z); }
  }
}

const g = new Voxels([W, H, D]);

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Face index along the facade and the face used for pattern.
function facadeInfo(x, z) {
  const f = faces(x, z);
  if (f.N) return { face: "N", idx: x };
  if (f.S) return { face: "S", idx: x };
  if (f.W) return { face: "W", idx: z };
  return { face: "E", idx: z };
}

// Wall column content at height y for a wall cell whose base is g0.
function placeWallCell(x, z, g0) {
  const { face, idx } = facadeInfo(x, z);
  const door = doorKey === key(x, z);
  const paneProps = face === "N" || face === "S" ? paneNS : paneEW;

  // Lit window: glowstone in the room behind the glass.
  const litHere = (y) => y === 7 && idx % 3 === 1 && (idx * 5 + face.charCodeAt(0)) % 4 === 0;

  for (let y = g0; y <= CAP_Y; y++) {
    if (y === g0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (door) {
      if (y === g0 + 1) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === g0 + 2) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === g0 + 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
    }
    if (y <= 3) {
      if (idx % 3 === 0) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "glass");
      continue;
    }
    if (y === 4) { g.set(x, y, z, "red_concrete"); continue; }
    if (y === 5) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y <= 9) {
      if (idx % 3 === 1) g.set(x, y, z, "glass_pane", paneProps);
      else g.set(x, y, z, "white_terracotta");
      continue;
    }
    if (y === 10) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y <= 12) { g.set(x, y, z, "white_terracotta"); continue; }
    g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  // Glowstone behind a few upper windows.
  if (idx % 3 === 1 && (idx * 5 + face.charCodeAt(0)) % 4 === 0) {
    const f = faces(x, z);
    const [ix, iz] = f.N ? [x, z + 1] : f.S ? [x, z - 1] : f.W ? [x + 1, z] : [x - 1, z];
    if (isInterior(ix, iz)) g.set(ix, 7, iz, "glowstone");
  }
}

// Foundations, walls, floors and roof deck.
for (const [x, z] of cells) {
  const g0 = gr(x, z);
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone");

  if (isWall(x, z)) {
    placeWallCell(x, z, g0);
  } else {
    if (g0 <= 5) g.set(x, 5, z, "smooth_stone");     // upper storey floor slab
    g.set(x, ROOF_Y, z, "stone");                     // roof deck
  }
}

// Rooftop water tank: 3x3 of interior cells, nearest the centre.
const cxC = (minX + maxX) / 2;
const czC = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let tank = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    let ok = true;
    for (let dx = 0; dx < 3 && ok; dx++)
      for (let dz = 0; dz < 3 && ok; dz++)
        if (!isInterior(x + dx, z + dz)) ok = false;
    if (!ok) continue;
    const d = Math.hypot(x + 1 - cxC, z + 1 - czC);
    if (d < best) { best = d; tank = { x, z }; }
  }
}
if (tank) {
  for (let dx = 0; dx < 3; dx++)
    for (let dz = 0; dz < 3; dz++) {
      const x = tank.x + dx, z = tank.z + dz;
      g.set(x, ROOF_Y + 1, z, "cyan_terracotta");
      g.set(x, ROOF_Y + 2, z, "cyan_terracotta");
      g.set(x, ROOF_Y + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
}

// Lightning rod on a free interior roof cell.
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if (tank && x >= tank.x && x < tank.x + 3 && z >= tank.z && z < tank.z + 3) continue;
  g.set(x, ROOF_Y + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  g.set(x, ROOF_Y + 2, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  break;
}

g.save(`${DIR}/${ID}.nbt`);
