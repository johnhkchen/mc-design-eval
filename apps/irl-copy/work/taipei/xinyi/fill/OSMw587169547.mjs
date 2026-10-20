// OSMw587169547: unrecorded Xinyi office block, c. 1995 to 2000 era.
// Ten storeys of 5 blocks, white concrete frame with light-blue glass bays,
// stone-brick plinth, a setback at storey 8 (y 35), a parapet roof at y 50,
// and a central plant penthouse with warm shroomlight accents.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169547";
const W = 41, H = 62, D = 35;
const TOP = 50;        // main roof surface
const SETBACK = 35;    // upper tier starts here
const TIER_DEPTH = 4;  // upper tier inset from the outer edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Footprint and ground per cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const inFp = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Depth from the outer edge (0 = perimeter cell), by BFS
const depth = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dirs.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    depth.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (inFp(nx, nz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Active set per height: full footprint up to the setback, upper tier above it
const act = (x, z, y) => {
  const k = key(x, z);
  if (!ground.has(k)) return false;
  return y < SETBACK || (depth.get(k) ?? 0) >= TIER_DEPTH;
};
const facade = (x, z, y) =>
  act(x, z, y) && dirs.some(([dx, dz]) => !act(x + dx, z + dz, y));

const isPier = (x, z, y) => {
  const zFace = !act(x, z - 1, y) || !act(x, z + 1, y);
  const xFace = !act(x - 1, z, y) || !act(x + 1, z, y);
  if (zFace && xFace) return true;
  if (zFace) return x % 3 === 0;
  return z % 3 === 0;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const TF = (b) => (b ? "true" : "false");

// Main body
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (!act(x, z, y)) {
      // Setback terrace on the ring below the upper tier
      if (y === SETBACK && d < TIER_DEPTH) put(x, y, z, "white_concrete");
      else if (y === SETBACK + 1 && d === 0) put(x, y, z, "white_concrete");
      else if (y === SETBACK + 1 && d >= 1 && d <= 3) put(x, y, z, "moss_carpet");
      continue;
    }

    if (y === TOP) { put(x, y, z, "light_gray_concrete"); continue; }

    const r = y % 5;
    if (r === 0) { put(x, y, z, "white_concrete"); continue; }

    if (facade(x, z, y)) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }   // base course
      if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel
      if (isPier(x, z, y)) { put(x, y, z, "white_concrete"); continue; }
      // Glass bay with frame connections to neighbouring walls
      put(x, y, z, "light_blue_stained_glass_pane", {
        north: TF(facade(x, z - 1, y)),
        south: TF(facade(x, z + 1, y)),
        east: TF(facade(x + 1, z, y)),
        west: TF(facade(x - 1, z, y)),
        waterlogged: "false",
      });
    } else {
      // Warm light just behind the glass, on odd storeys only
      if (r === 2 && d === 1 && (x + z) % 6 === 0 && Math.floor(y / 5) % 2 === 1) {
        put(x, y, z, "glowstone");
      }
    }
  }
}

// Parapet on the main roof edge
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (act(x, z, TOP) && facade(x, z, TOP)) put(x, TOP + 1, z, "white_concrete");
}

// Central plant penthouse with shroomlight accents and a lightning rod
const cx = Math.round([...ground.keys()].reduce((s, k) => s + +k.split(",")[0], 0) / ground.size);
const cz = Math.round([...ground.keys()].reduce((s, k) => s + +k.split(",")[1], 0) / ground.size);
const P = new Set();
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 0;
  if (act(x, z, TOP) && d >= 6 && Math.abs(x - cx) <= 7 && Math.abs(z - cz) <= 6) P.add(k);
}
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, "gray_concrete");
  const edge = dirs.some(([dx, dz]) => !P.has(key(x + dx, z + dz)));
  if (edge && (x + z) % 4 === 0) put(x, TOP + 4, z, "shroomlight");
}
if (P.has(key(cx, cz))) {
  for (let y = TOP + 4; y <= TOP + 6; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Entrance: the front row (lowest z) nearest the footprint's centre line
const candidates = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!inFp(x, z - 1) && (depth.get(k) ?? 0) === 0) candidates.push([x, z, gr]);
}
candidates.sort((a, b) => a[1] - b[1] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
if (candidates.length) {
  const [dx, dz, dg] = candidates[0];
  // Canopy: stone slab band across the entrance, with lanterns hung at its ends
  for (let x = dx - 2; x <= dx + 2; x++) {
    if (!inFp(x, dz) || x === dx) continue;
    if (gAt(x, dz) > dg + 2) continue;
    put(x, dg + 2, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  put(dx, dg + 2, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // Double door (north-facing, out toward the street)
  put(dx, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const lx of [dx - 2, dx + 2]) {
    if (inFp(lx, dz) && gAt(lx, dz) <= dg + 1) {
      put(lx, dg + 1, dz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
