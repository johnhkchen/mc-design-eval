import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542608968";
const W = 13, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// [dx, dz, name]; a missing neighbour in direction d means that face is the street facade
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const miss = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => has(x, z) && miss(x, z).length > 0;

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const panePropsFor = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Door: on the south face, nearest the middle of the frontage
const doorCandidates = cells.filter(([x, z]) => {
  const m = miss(x, z);
  return m.length === 1 && m[0][2] === "south";
});
doorCandidates.sort((a, b) => Math.abs(a[0] - 6) - Math.abs(b[0] - 6));
const door = doorCandidates.length ? { x: doorCandidates[0][0], z: doorCandidates[0][1] } : null;

// Foundations, base, walls, storeys, interiors, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const m = miss(x, z);
    const corner = m.length >= 2;
    const [dx] = m[0];
    const isDoor = door && door.x === x && door.z === z;
    const p = (x + z) % 3;

    for (let rel = 0; rel <= 11; rel++) {
      const y = gr + rel;
      let b = "white_concrete";
      let props;

      if (corner) {
        if (rel === 0) b = "stone_bricks";
        else if (rel === 5 || rel === 10) b = "quartz_block";
        else b = "white_concrete";
        put(x, y, z, b);
        continue;
      }

      if (rel === 0) b = "stone_bricks";
      else if (rel >= 1 && rel <= 3) {
        if (isDoor && rel <= 2) {
          // door handled below
          continue;
        } else if (isDoor && rel === 3) {
          b = "stone_bricks"; // lintel over entrance
        } else if (p === 0) b = "stone_bricks";
        else { b = "glass_pane"; props = panePropsFor(dx); }
      } else if (rel === 4) b = "white_concrete";
      else if (rel === 5) b = "quartz_block";
      else if (rel >= 6 && rel <= 8) {
        if (p === 0) b = "white_concrete";
        else { b = "glass_pane"; props = panePropsFor(dx); }
      } else if (rel === 9) b = "white_concrete";
      else if (rel === 10) b = "quartz_block";
      else if (rel === 11) b = "white_concrete";

      put(x, y, z, b, props);
    }

    if (isDoor) {
      const dprops = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
      put(x, gr + 1, z, "oak_door", dprops("lower"));
      put(x, gr + 2, z, "oak_door", dprops("upper"));
    }
  } else {
    // Interior: floor slabs at storey lines and roof deck, air between
    put(x, gr + 0, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Roof equipment: AC boxes and a taller plant unit
    if ((x * 3 + z * 5) % 7 === 0) put(x, gr + 11, z, "light_gray_concrete");
    if ((x + 2 * z) % 9 === 0) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "iron_block");
    }
  }
}

// Warm lights behind shopfront and upper windows, on interior cells just inside the facade
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const m = miss(x, z);
  if (m.length !== 1) continue;
  const [dx, dz] = m[0];
  const p = (x + z) % 3;
  if (p !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const gi = G(ix, iz);
  // Ground floor lantern standing on the interior floor
  put(ix, gi + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  // Upper storey glowstone standing on the storey-2 floor, every other bay
  if ((x * 2 + z) % 4 === 1) put(ix, gi + 6, iz, "glowstone");
}

g.save(`${dir}/${id}.nbt`);
