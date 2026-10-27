// A four-storey mid-century commercial block (1950s-60s, Auckland's reinforced-concrete shop-and-office stock): a
// stone plinth, quartz spandrels with red brick piers between steel-framed glass bays, a glazed shopfront on the
// ground floor, an iron-framed entrance on the south face, and a parapet. The lidar roof (3x3 median) is snapped to
// four flat tiers: 16 for the body (the parapet takes it to 18), 12, 8 and 4 for the wings and the notch. Each
// storey is a 4-block module: a floor slab, two window rows, a spandrel. Interiors are air with a floor slab per
// storey and a deck on the roof; glowstone sits behind some glass, a lantern inside the entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269385743.cells.json", "utf8"));
const W = 69, D = 44, H = 20;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// cells from the footprint edge (1 on the outside ring), through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// roof: 3x3 median of the lidar, then four flat tiers (top = first y with no solid)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOP = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  TOP[x][z] = m >= 15 ? 16 : m >= 12 ? 12 : m >= 8 ? 8 : 4;
}

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose top is at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || TOP[nx][nz] <= y;
});

// the entrance: the middle of the south-facing run of the main body, two cells wide
const south = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && TOP[x][z] === 16 && !inside(x, z + 1)) south.push([x, z]);
south.sort((a, b) => a[0] - b[0]);
const midCell = south[south.length >> 1];
const door = [midCell, south.find(([x, z]) => x === midCell[0] + 1 && z === midCell[1]) ? [midCell[0] + 1, midCell[1]] : [midCell[0] - 1, midCell[1]]].sort((a, b) => a[0] - b[0]);
const DOOR = new Set(door.map(([x, z]) => `${x},${z}`));
const doorLeft = door[0];

const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const T = TOP[x][z];
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) {                                                   // interior: a slab per storey, the roof deck, air between
      if (y % 4 === 0) g.set(x, y, z, "smooth_stone");
      else if (y === T - 1) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (DOOR.has(`${x},${z}`) && (y === 1 || y === 2) && ex.includes("S")) {
      const hinge = x === doorLeft[0] ? "left" : "right";
      g.set(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // plinth
    if (y % 4 === 0 || y % 4 === 3) { g.set(x, y, z, "quartz_block"); continue; }   // floor line and spandrel
    // window rows: a brick pier at each corner and every third cell along the face, glass between
    const along = ex.includes("N") || ex.includes("S") ? x : z;
    if (ex.length > 1 || along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    // glowstone in some bays, one cell behind the pane (inside the air gap)
    if (y % 4 === 1 && (Math.floor(along / 3) + 2 * Math.floor(y / 4)) % 5 === 0) {
      const [dx, dz] = DIRS[ex[0]], bx = x - dx, bz = z - dz;
      if (inside(bx, bz) && !exposed(bx, bz, y).length) g.set(bx, y, bz, "glowstone");
    }
  }
  // parapet on the outer edge of the main body (to 18 blocks), a coping on the lower wings
  if (Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz))) {
    if (T === 16) { g.set(x, 16, z, "quartz_block"); g.set(x, 17, z, "quartz_block"); }
    else g.set(x, T, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  // roof plant on the diagonal strip the lidar reads a metre higher: pale steel HVAC, not dark blobs
  if (T === 16 && R[x][z] >= 17 && dist[x][z] >= 3) g.set(x, 16, z, "iron_block");
}

// the entrance's lantern on the floor just inside the left door cell
g.set(doorLeft[0], 1, doorLeft[1] - 1, "lantern", { hanging: "false", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269385743.nbt";
const info = g.save(out);
console.log("way_269385743", info, "door", door);
