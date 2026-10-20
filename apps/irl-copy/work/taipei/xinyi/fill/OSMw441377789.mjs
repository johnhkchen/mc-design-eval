import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise, c. 1980s Taipei: 2 storeys over a shopfront ground floor,
// cream quartz-tile facade with light-blue glass bays, a parapet, and a rooftop tank.
// Roof is flat at absolute height 11 (body to y 10, parapet at y 11).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377789";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 30;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

// n = -z side, s = +z side, w = -x side, e = +x side
function exposed(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}
const isInterior = (x, z) => has(x, z) && exposed(x, z).length === 0;
const FACING = { n: "north", s: "south", w: "west", e: "east" };

// Entrance: a single-face ground-level cell, preferring the north face, nearest the middle.
let entr = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (gr > 2) continue;
    const ex = exposed(x, z);
    if (ex.length !== 1) continue;
    const face = ex[0];
    const along = (face === "n" || face === "s") ? x : z;
    const mid = (face === "n" || face === "s") ? cx : cz;
    const score = (face === "n" ? 0 : 1000) + Math.abs(along - mid);
    if (score < best) {
      best = score;
      entr = { x, z, face, u: along };
    }
  }
}

const isLit = (x, y, z) => (x * 5 + y * 3 + z * 7) % 7 === 0;

function paneProps(face, u) {
  const p = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (face === "n" || face === "s") {
    if (u % 3 === 1) p.east = "true";
    if (u % 3 === 2) p.west = "true";
  } else {
    if (u % 3 === 1) p.south = "true";
    if (u % 3 === 2) p.north = "true";
  }
  return p;
}

function facade(x, y, z, face, gr) {
  const u = (face === "n" || face === "s") ? x : z;
  const isEntr = entr && entr.x === x && entr.z === z && entr.face === face;
  const nearEntr = entr && entr.face === face && Math.abs(u - entr.u) <= 1;

  if (y === gr) { g.set(x, y, z, "stone_bricks"); return; }

  if (isEntr && y === gr + 1) {
    g.set(x, y, z, "dark_oak_door", { facing: FACING[face], half: "lower", hinge: "left", open: "false", powered: "false" });
    return;
  }
  if (isEntr && y === gr + 2) {
    g.set(x, y, z, "dark_oak_door", { facing: FACING[face], half: "upper", hinge: "left", open: "false", powered: "false" });
    return;
  }

  if (y <= 4) {
    // Ground floor: shopfront with glass bays, storey lintel at y 4 with a canopy over the entrance.
    if (y === 4) {
      if (nearEntr) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_quartz");
      return;
    }
    if (u % 3 === 0 || nearEntr) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); return; }
    if (isLit(x, y, z) && y >= gr + 1) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face, u));
    return;
  }

  if (y === 5) { g.set(x, y, z, "smooth_quartz"); return; }

  if (y <= 8) {
    // Upper storey bays.
    if (u % 3 === 0) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); return; }
    if (isLit(x, y, z)) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face, u));
    return;
  }

  // y 9 lintel line (cornice band handled by caller for y 10/11)
  g.set(x, y, z, "smooth_quartz");
}

// Foundations, floors, walls and roof.
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= 11; y++) {
    if (y === 10) {
      g.set(x, y, z, perim ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (y === 11) {
      if (perim) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (!perim) {
      if (y === gr || y === 5) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (ex.length >= 2) {
      // Corner column.
      if (y === gr) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    facade(x, y, z, ex[0], gr);
  }
}

// Rooftop water tank (2x2, y 11..13) on interior roof, and a small AC unit.
{
  let tank = null, bestT = Infinity;
  const tx = minX + 3, tz = minZ + Math.round((maxZ - minZ) / 4);
  for (let x0 = minX; x0 < maxX; x0++) {
    for (let z0 = minZ; z0 < maxZ; z0++) {
      const pts = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
      if (!pts.every(([x, z]) => isInterior(x, z) && ground.get(`${x},${z}`) <= 10)) continue;
      const d = Math.abs(x0 - tx) + Math.abs(z0 - tz);
      if (d < bestT) { bestT = d; tank = { x0, z0 }; }
    }
  }
  if (tank) {
    for (let y = 11; y <= 13; y++)
      for (let dx = 0; dx < 2; dx++)
        for (let dz = 0; dz < 2; dz++)
          g.set(tank.x0 + dx, y, tank.z0 + dz, "white_concrete");
    // AC unit: interior roof cell away from the tank.
    let ac = null, bestA = -1;
    for (const [x, z, gr] of cells) {
      if (!isInterior(x, z) || gr > 10) continue;
      const inTank = x >= tank.x0 - 1 && x <= tank.x0 + 2 && z >= tank.z0 - 1 && z <= tank.z0 + 2;
      if (inTank) continue;
      const d = Math.abs(x - (maxX - 2)) + Math.abs(z - (maxZ - 4));
      if (ac === null || d < bestA) { bestA = d; ac = { x, z }; }
    }
    if (ac) g.set(ac.x, 11, ac.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
