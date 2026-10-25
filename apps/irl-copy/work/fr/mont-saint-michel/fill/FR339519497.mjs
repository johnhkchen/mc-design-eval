import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR339519497";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 21, D = 63;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(`${x},${z}`, { x, z, gr, rf });
const has = (x, z) => cm.has(`${x},${z}`);
const at = (x, z) => cm.get(`${x},${z}`);

// Eave = wall top; ridge follows lidar roof height, smoothed.
function geom(c) {
  const eave = Math.max(c.gr + 4, c.rf - 4);
  const ridge = Math.min(H - 2, Math.max(c.rf, eave + 2));
  return { eave, ridge };
}
// Gabled roof surface per column, rising from eaves to ridge.
function topAt(c) {
  const { eave, ridge } = geom(c);
  const d = Math.min(c.x, W - 1 - c.x);
  return Math.min(ridge, eave + Math.round((d * (ridge - eave)) / 12));
}
function faces(c) {
  const f = [];
  if (!has(c.x, c.z - 1)) f.push("north");
  if (!has(c.x, c.z + 1)) f.push("south");
  if (!has(c.x - 1, c.z)) f.push("west");
  if (!has(c.x + 1, c.z)) f.push("east");
  return f;
}
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const list = cells.map(([x, z, gr, rf]) => ({ x, z, gr, rf }));

for (const c of list) {
  const { x, z, gr } = c;
  const { eave } = geom(c);
  const top = topAt(c);
  const fs = faces(c);
  const facade = fs.length > 0;
  const primary = fs[0];
  const onNS = primary === "north" || primary === "south";
  const a = onNS ? x : z; // index along the facade

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls
  for (let y = gr; y < eave; y++) {
    if (!facade) { g.set(x, y, z, "stone"); continue; }
    let blk = "stone_bricks";
    if (y === gr) blk = "cobblestone";                 // base course
    else if (y === eave - 1) blk = "smooth_stone";      // cornice band
    else if (a % 6 === 0) blk = "chiseled_stone_bricks"; // pilasters every 6 cells
    else if (y === gr + 5 && eave - 1 > gr + 5) blk = "stone_brick_slab"; // string course
    g.set(x, y, z, blk);
  }

  if (facade) {
    // Barn gate centred on the short ends
    const gate = !onNS ? false : (a >= 8 && a <= 17);
    const sideGate = !onNS && false;
    if (gate) {
      // Opening and lintel
      for (let y = gr; y < Math.min(gr + 4, eave - 1); y++) g.set(x, y, z, "dark_oak_planks");
      if (gr + 4 < eave - 1) g.set(x, gr + 4, z, "stone_bricks");
      // Gate frame posts flanking the opening
      if (a === 8 || a === 17) {
        // already part of wall; keep pilasters
      }
    } else {
      // Paired windows with sills and lintels
      const winCol = (a % 4 === 1 || a % 4 === 2) && a % 6 !== 0;
      if (winCol) {
        const lit = (a * 7 + gr) % 4 === 0;
        // sill
        if (gr + 1 < eave - 1) g.set(x, gr + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        for (const y of [gr + 2, gr + 3]) {
          if (y >= eave - 1) continue;
          if (y === gr + 2 && lit) {
            g.set(x, y, z, "glowstone");
          } else {
            g.set(x, y, z, "glass_pane", onNS ? paneEW : paneNS);
          }
        }
        // lintel above window
        if (gr + 4 < eave - 1) g.set(x, gr + 4, z, "stone_bricks");
      }
    }
  }

  // Interior mass and roof
  const ridgeCol = x === 12 || x === 13;
  for (let y = eave; y < top; y++) {
    const isTop = y === top - 1;
    if (!isTop) {
      g.set(x, y, z, (z % 2 === 0) ? "deepslate_tiles" : "deepslate_bricks");
      continue;
    }
    const hasL = x < W / 2 && has(x - 1, z) && topAt(at(x - 1, z)) < top;
    const hasR = x >= W / 2 && has(x + 1, z) && topAt(at(x + 1, z)) < top;
    if (ridgeCol && top >= topAt(at(x === 12 ? 11 : 14, z) ?? c)) {
      // Ridge cap as a top slab
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else if (hasL) {
      g.set(x, y, z, "deepslate_tile_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
    } else if (hasR) {
      g.set(x, y, z, "deepslate_tile_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      g.set(x, y, z, "deepslate_tiles");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
