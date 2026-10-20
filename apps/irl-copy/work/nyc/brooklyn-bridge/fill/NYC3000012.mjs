import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000012";
const W = 33, H = 29, D = 20;

// ---- input -------------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw));

const cell = new Map();
for (const [x, z, gr, rf] of list) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cell.set(`${x},${z}`, { g: Math.min(Math.max(Math.round(gr), 0), H - 10), r: rf });
}
const has = (x, z) => cell.has(`${x},${z}`);

// Smooth the lidar roof over a 3x3 neighbourhood into flat tiers.
function smoothRoof(x, z, g) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cell.get(`${x + dx},${z + dz}`);
    if (c) { s += c.r; n++; }
  }
  const avg = Math.round(s / Math.max(n, 1));
  return Math.min(Math.max(avg, g + 6), 25);
}
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  c.R = smoothRoof(x, z, c.g);
}

// ---- helpers -----------------------------------------------------------
// Perimeter face: inward direction, index along the face, outward facing.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dx: 0, dz: 1, idx: x, out: "north" };
  if (!has(x, z + 1)) return { dx: 0, dz: -1, idx: x, out: "south" };
  if (!has(x - 1, z)) return { dx: 1, dz: 0, idx: z, out: "west" };
  if (!has(x + 1, z)) return { dx: -1, dz: 0, idx: z, out: "east" };
  return null;
}
const isEdge = (x, z) => faceOf(x, z) !== null;

// Entrances: a two-bay doorway centred on each long (z) face.
const DOOR_A = 15, DOOR_B = 16;
const isPier = (idx) => idx % 3 === 0;

// ---- build ---------------------------------------------------------------
const g = new Voxels([W, H, D]);

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const G = c.g, R = c.R;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  if (!f) {
    // Interior: floor slab per storey, tar roof deck, air elsewhere.
    for (let y = G; y < R; y++) {
      const rel = y - G;
      if (rel === R - 1 - G) g.set(x, y, z, "black_concrete");
      else if (rel % 3 === 0) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter wall: brick shell with glazing, belts, cornice and parapet.
  const ix = x + f.dx, iz = z + f.dz;
  const interiorOk = has(ix, iz) && !isEdge(ix, iz);
  const onLongFace = f.dz !== 0;
  const doorIdx = onLongFace && (f.idx === DOOR_A || f.idx === DOOR_B);
  const doorSurround = onLongFace && f.idx >= DOOR_A - 1 && f.idx <= DOOR_B + 1;

  for (let y = G; y < R; y++) {
    const rel = y - G;
    const top = R - 1 - G;
    let id = "bricks", props;

    if (rel === 0) {
      id = "polished_granite";                       // base course
    } else if (rel === top) {
      id = "stone_bricks";                           // parapet
    } else if (rel === top - 1) {
      id = "smooth_stone";                           // cornice band
    } else if (rel === 1 || rel === 2) {
      // Ground floor: shopfront, piers, two-bay entrance.
      if (doorIdx) {
        id = "dark_oak_door";
        props = {
          facing: f.out,
          half: rel === 1 ? "lower" : "upper",
          hinge: f.idx === DOOR_A ? "left" : "right",
          open: "false",
          powered: "false",
        };
      } else if (doorSurround) {
        id = "stone_bricks";                         // stone door surround
      } else if (isPier(f.idx)) {
        id = "stone_bricks";
      } else {
        id = "glass_pane";
      }
    } else if (rel % 3 === 0) {
      id = "smooth_stone";                           // storey belt course
    } else {
      id = isPier(f.idx) ? "bricks" : "glass_pane";  // upper window rows
    }

    g.set(x, y, z, id, props);

    // Warm light behind some glazing; always lit behind the entrance.
    if (interiorOk) {
      const glazed = id === "glass_pane" || doorIdx;
      if (doorIdx && rel === 1) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      else if (glazed && ((f.idx * 7 + rel * 3) % 11 === 0)) g.set(ix, y, iz, "shroomlight");
    }
  }

  // Entrance: a stone lintel one storey above the doors reads as a portal.
  if (doorSurround && f.dz !== 0 && G + 3 < R - 2) {
    g.set(x, G + 3, z, "smooth_stone");
  }
}

// ---- roof equipment: penthouse on interior cells near the middle of the roof
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x < 8 || x > 13 || z < 6 || z > 11) continue;
  const R = c.R;
  if (R + 2 > H) continue;
  for (let y = R; y <= R + 1; y++) {
    g.set(x, y, z, y === R + 1 ? "stone_brick_slab" : "smooth_stone",
      y === R + 1 ? { type: "bottom", waterlogged: "false" } : undefined);
  }
}

g.save(`${DIR}/${ID}.nbt`);
