import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587177075";
const W = 16, H = 33, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground level (absolute y of the cell's floor)
const key = (x, z) => x + "," + z;
const G = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.max(0, Math.min(Math.round(gr), 20)));
}
const has = (x, z) => G.has(key(x, z));

// Outward directions
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const facesOf = (x, z) =>
  Object.keys(DIRS).filter((f) => !has(x + DIRS[f][0], z + DIRS[f][1]));

// Perimeter info per cell
const info = new Map();
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  const face = faces[0] ?? null;
  const a = face === "W" || face === "E" ? z : x; // along-wall index
  info.set(k, { x, z, gr, faces, face, a, perim: faces.length > 0, corner: faces.length >= 2 });
}

// Entrance: a single-face cell on the south (+z) face nearest the middle, else any single face
let entranceKey = null;
{
  const singles = [...info.values()].filter((c) => c.faces.length === 1);
  let pool = singles.filter((c) => c.face === "S");
  if (pool.length === 0) pool = singles;
  if (pool.length > 0) {
    const as = pool.map((c) => c.a).sort((p, q) => p - q);
    const mid = as[Math.floor(as.length / 2)];
    pool.sort((p, q) => Math.abs(p.a - mid) - Math.abs(q.a - mid));
    entranceKey = key(pool[0].x, pool[0].z);
  }
}

// Window element for a perimeter cell at height y
function paneProps(face) {
  const ns = face === "W" || face === "E";
  return ns
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

function windowBlock(c, y, isEntrance) {
  const { gr, corner, a, face } = c;
  if (corner) return ["white_concrete"];
  if (isEntrance) {
    if (y === gr + 1 || y === gr + 2) return null; // open doorway
    if (y === gr + 3) return ["light_gray_concrete"]; // lintel / canopy edge
  }
  if (a % 2 === 0) return ["white_concrete"]; // mullion
  if (y <= 4) return ["glass"]; // shopfront glazing
  return ["light_blue_stained_glass_pane", paneProps(face)];
}

// Main build
for (const c of info.values()) {
  const { x, z, gr, perim } = c;
  const isEntrance = key(x, z) === entranceKey;

  for (let y = 0; y <= 21; y++) {
    if (y < gr) {
      g.set(x, y, z, "stone");
      continue;
    }
    if (y === gr) {
      g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === 21) {
      if (perim) g.set(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (y === 20) {
      g.set(x, y, z, perim ? "light_gray_concrete" : "stone_bricks"); // cornice / roof slab
      continue;
    }
    if (y === 5 || y === 10 || y === 15) {
      g.set(x, y, z, perim ? "light_gray_concrete" : "smooth_stone"); // floor slabs / storey lines
      continue;
    }
    if (!perim) continue; // interior air

    if (y <= 4) {
      if (y === 4) {
        g.set(x, y, z, "smooth_stone"); // ground-floor sign band
      } else {
        const blk = windowBlock(c, y, isEntrance);
        if (blk) placeBlock(x, y, z, blk);
      }
    } else {
      const rel = (y - 5) % 5;
      if (rel === 4) {
        g.set(x, y, z, "light_gray_concrete"); // spandrel
      } else {
        const blk = windowBlock(c, y, false);
        if (blk) placeBlock(x, y, z, blk);
      }
    }
  }
}

function placeBlock(x, y, z, blk) {
  if (blk.length === 1) g.set(x, y, z, blk[0]);
  else g.set(x, y, z, blk[0], blk[1]);
}

// Warm lights behind some windows (interior air cells just inside the glass)
for (const c of info.values()) {
  if (!c.perim || c.faces.length !== 1 || c.a % 4 !== 1) continue;
  const [ox, oz] = DIRS[c.face];
  const ix = c.x - ox, iz = c.z - oz;
  const inner = facesOf(ix, iz).length === 0 && has(ix, iz);
  if (!inner) continue;
  const rows = [7, 12, 17];
  if (c.gr + 2 <= 4) rows.push(c.gr + 2);
  for (const y of rows) {
    if (y > c.gr && y <= 20) g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop plant: a plinth with a smaller unit on top, centred on interior cells
for (const c of info.values()) {
  if (c.perim) continue;
  if (c.x >= 5 && c.x <= 10 && c.z >= 4 && c.z <= 8) {
    g.set(c.x, 21, c.z, "light_gray_concrete");
  }
  if (c.x >= 6 && c.x <= 9 && c.z >= 5 && c.z <= 7) {
    g.set(c.x, 22, c.z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
