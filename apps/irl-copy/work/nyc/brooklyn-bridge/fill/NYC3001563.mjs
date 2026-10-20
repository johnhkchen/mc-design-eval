import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001563";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 22, D = 9;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const k = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(k(x, z), { gc: gr, roof });
const has = (x, z) => cellMap.has(k(x, z));
const gOf = (x, z) => cellMap.get(k(x, z)).gc;

// flatten the lidar roof into one clean parapet height
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const R = Math.min(H - 4, Math.round(roofs[Math.floor(roofs.length / 2)]));
const B = Math.min(...cells.map((c) => c[2])); // base level (lowest ground)

// storey rows: base row B, window rows B+1,B+3,..., belt rows B+2,B+4,...
const isWinRow = (y) => y >= B + 1 && y <= R - 1 && (y - B) % 2 === 1;
const isBeltRow = (y) => y >= B + 2 && y <= R - 1 && (y - B) % 2 === 0;

const DIRS = {
  n: { dx: 0, dz: -1, along: "x" },
  s: { dx: 0, dz: 1, along: "x" },
  w: { dx: -1, dz: 0, along: "z" },
  e: { dx: 1, dz: 0, along: "z" },
};
const exposed = (x, z) =>
  Object.keys(DIRS).filter((d) => !has(x + DIRS[d].dx, z + DIRS[d].dz));

// index of a cell along its exposed face and the face length
const faceIdx = (x, z, d) => (DIRS[d].along === "x" ? x : z);
const faceLen = (d) => (DIRS[d].along === "x" ? W : D);

// window bays in pairs with a pier every third bay; corners stay solid
function isWindowFace(x, z, d) {
  const idx = faceIdx(x, z, d), L = faceLen(d);
  return idx >= 1 && idx <= L - 2 && idx % 3 !== 0;
}

// neighbour along the same face is also a window (for clean pane connections)
function neighbourWindow(x, z, d, step) {
  const nx = DIRS[d].along === "x" ? x + step : x;
  const nz = DIRS[d].along === "z" ? z + step : z;
  if (!has(nx, nz)) return false;
  if (exposed(nx, nz).indexOf(d) < 0) return false;
  return isWindowFace(nx, nz, d);
}

// ---- foundation ------------------------------------------------------------
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");
}

// ---- walls, windows, belts, base, entrance ---------------------------------
for (const [x, z, gc] of cells) {
  const ex = exposed(x, z);
  const isEdge = ex.length > 0;

  for (let y = gc; y <= R - 1; y++) {
    if (!isEdge) {
      // interior: floor slabs only
      if (y === B || isBeltRow(y)) g.set(x, y, z, "oak_planks");
      continue;
    }

    // entrance on the z=0 face: stone jambs flanking a dark oak door
    if (z === 0 && x === 2) {
      if (y === gc || y === gc + 1) {
        const half = y === gc ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
    }
    if (z === 0 && (x === 1 || x === 3) && (y === gc || y === gc + 1)) {
      g.set(x, y, z, "stone_bricks"); // door jambs
      continue;
    }

    if (y === gc || y === B) {
      g.set(x, y, z, "brown_terracotta"); // brownstone base course
      continue;
    }

    const winDirs = ex.filter((d) => isWindowFace(x, z, d));
    if (isWinRow(y) && winDirs.length > 0) {
      const d = winDirs[0];
      const alongX = DIRS[d].along === "x";
      const left = neighbourWindow(x, z, d, -1);
      const right = neighbourWindow(x, z, d, 1);
      g.set(x, y, z, "glass_pane", {
        north: alongX ? (left ? "true" : "false") : "false",
        south: alongX ? (right ? "true" : "false") : "false",
        east: alongX ? "false" : (right ? "true" : "false"),
        west: alongX ? "false" : (left ? "true" : "false"),
        waterlogged: "false",
      });
      // warm light just inside some windows
      const inX = x - DIRS[d].dx, inZ = z - DIRS[d].dz;
      if (has(inX, inZ) && (x + y) % 3 === 0) {
        g.set(inX, y, inZ, "glowstone");
      }
    } else if (isBeltRow(y)) {
      g.set(x, y, z, "stone_bricks"); // sill / floor belt course
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// ---- roof, cornice, parapet, chimneys --------------------------------------
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const edge = exposed(x, z).length > 0;
  if (edge) {
    g.set(x, R, z, "stone_bricks");            // cornice band
    g.set(x, R + 1, z, "bricks");              // parapet
    g.set(x, R + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // coping
  } else {
    g.set(x, R, z, "smooth_stone");            // roof deck
  }
}
for (const [cx, cz] of [[1, 3], [4, 5]]) {
  if (has(cx, cz) && exposed(cx, cz).length === 0) {
    g.set(cx, R + 1, cz, "bricks");
    g.set(cx, R + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
