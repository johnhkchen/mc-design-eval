// A 1970s concrete-frame office block on Queen Street's edge: 8 storeys over a stone plinth, a light-grey
// concrete frame with blue glass bays, a setback core that rises two storeys above the ring, lanterns behind
// some windows, a recessed street door on a stone canopy, and plant boxes on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_707962256.cells.json", "utf8"));

const W = 50, D = 46, N = W * D;
const at = (x, z) => z * W + x;
const ground = new Array(N).fill(null), raw = new Array(N).fill(0);
for (const [x, z, gr, r] of cells) { ground[at(x, z)] = gr; raw[at(x, z)] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[at(x, z)] !== null;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east

// distance in cells from the outer edge (1 = outer skin), so the core can be set back from the perimeter
const dist = new Array(N).fill(-1), queue = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist[at(x, z)] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    if (inFp(x + dx, z + dz) && dist[at(x + dx, z + dz)] < 0) { dist[at(x + dx, z + dz)] = dist[at(x, z)] + 1; queue.push([x + dx, z + dz]); }
  }
}

// lidar roof, smoothed into three flat tiers: wings 30, ring 35, core 38 (setback to 35 within 3 cells of the edge)
const top = new Array(N).fill(0);
for (const [x, z] of cells) {
  const i = at(x, z), r = raw[i];
  let t = r <= 31 ? 30 : r <= 35 ? 35 : 38;
  if (t === 38 && dist[i] < 3) t = 35;
  top[i] = t;
}
const solid = (x, y, z) => inFp(x, z) && y >= ground[at(x, z)] && y < top[at(x, z)];
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const isSkin = (x, y, z) => solid(x, y, z) && exposedDirs(x, y, z).length > 0;
// interior air: inside the footprint, not skin, not a floor slab, not the roof
const interiorAir = (x, y, z) => inFp(x, z) && y >= ground[at(x, z)] && y < top[at(x, z)] - 1 && y % 4 !== 0 && !isSkin(x, y, z);

const g = new Voxels([50, 51, 46]);
const CONCRETE = "light_gray_concrete", SPANDREL = "white_concrete", GLASS = "light_blue_stained_glass", STONE = "stone_bricks";
const DOOR = { x: 10, z: 0 };   // the street door on the north face, at the cell with the flattest front

for (const [x, z] of cells) {
  const i = at(x, z), gr = ground[i], t = top[i];
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, STONE); continue; }
    if (y === t - 1) { g.set(x, y, z, CONCRETE); continue; }             // roof slab / parapet cap
    if (x === DOOR.x && z === DOOR.z && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isSkin(x, y, z)) {
      const [dx, dz] = exposedDirs(x, y, z)[0];
      const u = dx !== 0 ? z : x;                                          // position along the face
      const pier = u % 3 === 0;
      if (y < 4) {                                                         // ground storey: plinth and shopfront
        if (y === gr) g.set(x, y, z, STONE);
        else if (pier) g.set(x, y, z, STONE);
        else g.set(x, y, z, GLASS);
      } else if (y % 4 === 0) {                                            // floor line: spandrel
        g.set(x, y, z, SPANDREL);
      } else if (pier) {                                                   // concrete mullion
        g.set(x, y, z, CONCRETE);
      } else {
        g.set(x, y, z, GLASS);
        // a lantern hung from the floor slab, just inside some windows
        const [ix, iz] = [x - dx, z - dz];
        if (y % 4 === 3 && (u * 7 + y * 3) % 11 === 0 && interiorAir(ix, y, iz)) {
          g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
        }
      }
    } else if (y % 4 === 0) {
      g.set(x, y, z, CONCRETE);                                            // floor slab, every storey
    }
  }
}

// the canopy over the street door: a stone slab on two posts, outside the north face
for (let x = DOOR.x - 2; x <= DOOR.x + 2; x++) {
  for (const z of [-1, -2]) g.set(x, 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [DOOR.x - 2, DOOR.x + 2]) for (let y = 0; y < 3; y++) g.set(x, y, -2, STONE);

// roof plant: two boxes on the core's roof, standing on the roof slab
for (const [x0, z0, w, d] of [[16, 14, 4, 3], [22, 17, 3, 3]]) {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
    if (top[at(x, z)] === 38) for (let y = 38; y <= 39; y++) g.set(x, y, z, CONCRETE);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_707962256.nbt");
console.log("way_707962256: blocks", g.count(), "palette", g.palette.length);
