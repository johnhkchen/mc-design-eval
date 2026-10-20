import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334676793";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Footprint lookup and ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map(c => c[2]));
const base = minG;            // lowest ground under footprint
const roofDeck = base + 10;   // top of storey 2 / roof slab
const parapet = base + 11;    // roof edge (about 11 above lowest ground)

// Outward normal for edge cells: [dx, dz] of the first missing neighbour
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // north, south, west, east
const normalOf = (x, z) => {
  for (const [dx, dz] of DIRS) if (!inFp(x + dx, z + dz)) return [dx, dz];
  return null;
};
const facingOf = ([dx, dz]) => (dz === -1 ? "north" : dz === 1 ? "south" : dx === -1 ? "west" : "east");

// Entrance: north-facing edge cell nearest the mean x of that face (fallback: any edge)
const edgeCells = cells.filter(([x, z]) => normalOf(x, z));
let entrance = null;
{
  const north = edgeCells.filter(([x, z]) => {
    const n = normalOf(x, z); return n && n[0] === 0 && n[1] === -1;
  });
  const pool = north.length ? north : edgeCells;
  if (pool.length) {
    const mx = pool.reduce((s, c) => s + c[0], 0) / pool.length;
    entrance = pool.reduce((best, c) => (Math.abs(c[0] - mx) < Math.abs(best[0] - mx) ? c : best));
  }
}
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

const glassProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const n = normalOf(x, z);
  const edge = !!n;
  const top = edge ? parapet : roofDeck;

  for (let y = gr; y <= top; y++) {
    if (!edge) {
      // Interior: air gap, floor slabs at storey lines and roof deck
      if (y === base + 5 || y === roofDeck) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const u = n[0] !== 0 ? z : x;          // coordinate along the wall
    const p = ((u % 4) + 4) % 4;           // 0 pilaster, 1-2 window, 3 spandrel
    const isPil = p === 0;
    const isWin = p === 1 || p === 2;

    if (y === parapet) { put(x, y, z, "white_concrete"); continue; }
    if (y === roofDeck) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === base + 5) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === gr && gr <= base + 4) { put(x, y, z, "stone_bricks"); continue; }

    if (y >= base + 1 && y <= base + 4) {
      // Ground floor: shopfront with entrance
      if (isEntrance(x, z)) {
        if (y === base + 1) { put(x, y, z, "dark_oak_door", { facing: facingOf(n), half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === base + 2) { put(x, y, z, "dark_oak_door", { facing: facingOf(n), half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === base + 4) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
        put(x, y, z, "white_concrete"); continue;
      }
      if (y === base + 4) { put(x, y, z, "smooth_stone"); continue; } // lintel
      if (isPil) { put(x, y, z, "smooth_quartz"); continue; }
      if (isWin && y <= base + 3) { put(x, y, z, "glass_pane", glassProps); continue; }
      put(x, y, z, "white_concrete"); continue;
    }

    if (y >= base + 6 && y <= base + 9) {
      // Upper storey: window grid with frames
      if (isPil) { put(x, y, z, "smooth_quartz"); continue; }
      if (isWin) { put(x, y, z, "glass_pane", glassProps); continue; }
      put(x, y, z, "white_concrete"); continue;
    }

    put(x, y, z, "white_concrete");
  }
}

// Warm lights behind some windows (glowstone in the interior cell behind the glass)
for (const [x, z] of edgeCells) {
  const n = normalOf(x, z);
  const u = n[0] !== 0 ? z : x;
  const p = ((u % 4) + 4) % 4;
  if (p !== 1) continue;
  const bx = x - n[0], bz = z - n[1];
  if (!inFp(bx, bz) || normalOf(bx, bz)) continue;
  if (u % 8 === 1) put(bx, base + 7, bz, "glowstone");
  else if (u % 8 === 5 && !isEntrance(x, z)) put(bx, base + 2, bz, "glowstone");
}

// Roof equipment: a few AC plant blocks on the roof deck, kept off the edges
for (const [x, z, gr] of cells) {
  if (normalOf(x, z)) continue;
  if (x % 6 === 3 && z % 6 === 3 && roofDeck >= gr) {
    put(x, parapet, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
