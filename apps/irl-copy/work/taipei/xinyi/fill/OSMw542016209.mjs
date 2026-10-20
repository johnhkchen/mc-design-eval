import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542016209";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.min(Math.max(Math.round(gr), 0), 8);
  G.set(key(x, z), ground);
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}

const has = (x, z) => G.has(key(x, z));
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const gAt = (x, z) => G.get(key(x, z));

const S = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Two storeys (floor line at y=5, parapet at y=12), flat roof deck at y=11.
const FLOOR = 5;
const SPANDREL_TOP = 10;
const CORNICE = 11;
const PARAPET = 12;

// Window vs pier: piers every 3 blocks along the street-facing bounds, corners solid.
const isWindow = (x, z) => {
  const onNS = z === zmin || z === zmax;
  const onEW = x === xmin || x === xmax;
  if (onNS && onEW) return false;
  if (onNS) return (x - xmin) % 3 !== 0 && x !== xmax;
  if (onEW) return (z - zmin) % 3 !== 0 && z !== zmax;
  return false;
};

// 1. Foundations, floor slabs and wall shell per footprint cell
for (const [x, z] of [...G.keys()].map(k => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  const isEdge = edge(x, z);

  // foundation from y0 up to the cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // ground surface: plinth on the edge, floor slab inside
  S(x, gr, z, isEdge ? "stone_bricks" : "smooth_stone");

  if (isEdge) {
    const win = isWindow(x, z);
    for (let y = gr + 1; y <= SPANDREL_TOP; y++) {
      if (y === FLOOR || y === SPANDREL_TOP) {
        S(x, y, z, "light_gray_concrete");
      } else if (y <= FLOOR - 1) {
        // ground-floor shopfront
        S(x, y, z, win ? "light_blue_stained_glass" : "white_concrete");
      } else {
        // upper storey window band
        S(x, y, z, win ? "light_blue_stained_glass" : "white_concrete");
      }
    }
    // cornice and parapet
    S(x, CORNICE, z, "smooth_quartz");
    S(x, PARAPET, z, "white_concrete");
  } else {
    // interior: upper floor slab and roof deck
    if (FLOOR > gr) S(x, FLOOR, z, "smooth_stone");
    S(x, CORNICE, z, "light_gray_concrete");
  }
}

// 2. Behind-glass warm lights (interior cells next to windows)
for (const [x, z] of [...G.keys()].map(k => k.split(",").map(Number))) {
  if (!edge(x, z) || !isWindow(x, z)) continue;
  const gr = gAt(x, z);
  const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
    .find(([nx, nz]) => has(nx, nz) && !edge(nx, nz));
  if (!inward) continue;
  const [ix, iz] = inward;
  if ((x * 7 + z * 3) % 4 === 0) S(ix, 7, iz, "glowstone");
  if ((x + z * 5) % 6 === 0) S(ix, gr + 2, iz, "glowstone");
}

// 3. Entrance on the street (north, zmin) side, centred
const cx = Math.floor((xmin + xmax) / 2);
if (has(cx, zmin)) {
  const gr = gAt(cx, zmin);
  // canopy across three bays
  for (let x = cx - 1; x <= cx + 1; x++) {
    if (!has(x, zmin)) continue;
    const gg = gAt(x, zmin);
    S(x, gg + 3, zmin, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // double-height door (lower and upper halves)
  S(cx, gr + 1, zmin, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  S(cx, gr + 2, zmin, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // lantern beside the door
  if (has(cx + 2, zmin)) {
    S(cx + 2, gAt(cx + 2, zmin) + 2, zmin, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Roof: corner lanterns and a central plant penthouse
for (const [x, z] of [[xmin, zmin], [xmax, zmin], [xmin, zmax], [xmax, zmax]]) {
  if (has(x, z)) S(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const mx = Math.floor((xmin + xmax) / 2);
const mz = Math.floor((zmin + zmax) / 2);
for (let x = mx - 3; x <= mx + 3; x++) {
  for (let z = mz - 2; z <= mz + 2; z++) {
    if (!has(x, z) || edge(x, z)) continue;
    S(x, 12, z, "gray_concrete");
    S(x, 13, z, "gray_concrete");
    S(x, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
// a small window band on the penthouse so it reads as a room, not a block
for (let x = mx - 2; x <= mx + 2; x++) {
  if (has(x, mz - 2) && !edge(x, mz - 2)) S(x, 12, mz - 2, "light_blue_stained_glass");
}

g.save(`${DIR}/${ID}.nbt`);
