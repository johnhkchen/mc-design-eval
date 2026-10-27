// Auckland way 363687871: a 1930s stripped-classical brick commercial block on a basalt plinth, four storeys over a
// setback. The lidar roof (11-18 above the lowest ground) is median-smoothed into two flat tiers: a 12-block ring at the
// edge and a 16-block core set back inside it (the core's walls show above the ring roof). Each storey is 4 blocks
// (floor band at y%4==0, windows on rows 1-2, lintel on row 3); piers of brick every third block; the ground floor is a
// shopfront (basalt bulkhead, glass, a stone fascia) with a dark-oak entrance and a flat stone hood. Parapets and a
// coping on the outer edge, plant boxes on the core roof. Glowstone sits behind some panes. Interiors are air with a
// floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363687871.cells.json", "utf8"));
const W = 84, D = 63, TOP = 31;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outsideDirs = (x, z) => Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && outsideDirs(x, z).length) {
  dist[x][z] = 1; queue.push([x, z]);
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, then two flat tiers on the storey grid (12 = three storeys, 16 = four)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof surface row of each cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  H[x][z] = median(x, z) >= 14 ? 16 : 12;
}

// a face is exposed at row y when it looks onto open sky: outside the footprint, or beside a roof that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] < y;
});
const ORDER = ["N", "S", "W", "E"];
const PANE = (k) => (k === "N" || k === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const OUT = { N: "north", S: "south", W: "west", E: "east" };

// the entrance: a ground-level edge cell near the middle of the footprint's outer ring, facing outward
const cx = W / 2, cz = D / 2;
let entrance = null, best = Infinity;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] !== 1 || G[x][z] > 1) continue;
  const out = outsideDirs(x, z).filter(k => k === "N" || k === "S");
  if (!out.length) continue;
  const d = Math.abs(x - cx) + Math.abs(z - cz);
  if (d < best) { best = d; entrance = { x, z, face: out[0] }; }
}
const doorBay = new Set();
if (entrance) {
  const along = (entrance.face === "N" || entrance.face === "S") ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const bx = entrance.x + along[0] * s, bz = entrance.z + along[1] * s;
    if (inside(bx, bz)) doorBay.add(`${bx},${bz}`);
  }
}

const g = new Voxels([W, TOP, D]);
let windows = 0, glows = 0;

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], edge = dist[x][z] === 1;

  // foundation: solid basalt from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "basalt");
  // roof surface; parapet and coping on the outer edge, plant boxes on the core roof
  g.set(x, top, z, "smooth_stone");
  if (edge && outsideDirs(x, z).length) {
    g.set(x, top + 1, z, "bricks");
    g.set(x, top + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  if (top === 16 && dist[x][z] >= 4 && x % 10 >= 3 && x % 10 <= 5 && z % 8 >= 2 && z % 8 <= 4) {
    g.set(x, top + 1, z, "stone_bricks");
    g.set(x, top + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and on the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const main = ORDER.find(k => ex.includes(k));
    const along = (main === "N" || main === "S") ? x : z;
    const pier = along % 3 === 0;
    const door = entrance && doorBay.has(`${x},${z}`) && ex.includes(entrance.face) && y < 4;

    if (door) {
      // the entrance bay: a dark-oak door (lower and upper halves) in the centre, glass either side, a stone hood above
      const isCentre = x === entrance.x && z === entrance.z;
      if (y === gr && isCentre) {
        g.set(x, y, z, "dark_oak_door", { facing: OUT[entrance.face], half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 1 && isCentre) {
        g.set(x, y, z, "dark_oak_door", { facing: OUT[entrance.face], half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 2 || (y === gr && !isCentre)) {
        g.set(x, y, z, y === gr + 2 ? "smooth_stone_slab" : "polished_basalt", y === gr + 2 ? { type: "bottom", waterlogged: "false" } : undefined);
      } else if (y === 3) {
        g.set(x, y, z, "smooth_stone");
      } else {
        g.set(x, y, z, "glass_pane", PANE(main));
      }
      continue;
    }

    if (y < 4) {
      // ground floor: a shopfront, basalt bulkhead on the first row, glass, stone fascia on row 3
      if (y === gr) g.set(x, y, z, "polished_basalt");
      else if (y === 3) g.set(x, y, z, "smooth_stone");
      else if (pier) g.set(x, y, z, "bricks");
      else { g.set(x, y, z, "glass_pane", PANE(main)); windows++; }
    } else if (y % 4 === 0) {
      g.set(x, y, z, "smooth_stone");                       // floor band / string course
    } else if (y % 4 === 3) {
      g.set(x, y, z, pier ? "bricks" : "smooth_stone");     // brick piers, stone lintels over the windows
    } else if (pier) {
      g.set(x, y, z, "bricks");
    } else {
      g.set(x, y, z, "glass_pane", PANE(main)); windows++;
    }

    // some windows lit from behind: a glowstone in the room just inside the glass
    const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[main];
    const ix = x + inward[0], iz = z + inward[1];
    if (inside(ix, iz) && exposed(ix, iz, y).length === 0 && y % 4 !== 0 && ((x * 7 + z * 13 + y * 3) % 9 === 0)) {
      g.set(ix, y, iz, "glowstone"); glows++;
    }
  }
}

console.log({ windows, glows, entrance });
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_363687871.nbt");
